from fastapi import APIRouter, Depends, BackgroundTasks
from core.database import execute, fetch_all
from client.openai_client import get_embeddings_batch_openai
from utils.safe_ops import safe_execute

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/migrate/vectors")
async def migrate_vectors():
    """
    [Admin] 기존 데이터 벡터화 마이그레이션 (동기 실행 - 디버깅용)
    """
    print("🚀 [Migration] API Called. Starting process...")
    try:
        count = await _process_vector_migration()
        return {"message": f"Migration finished. Processed {count} videos."}
    except Exception as e:
        print(f"❌ [Migration] Error in wrapper: {e}")
        return {"error": str(e)}

async def _process_vector_migration():
    """백그라운드에서 실행될 벡터 마이그레이션 작업 (전체 일괄 처리)"""
    
    total_processed = 0
    
    while True:
        # 1. 임베딩 없는 영상 조회
        print("🔍 [Migration] Fetching NULL embedding videos...")
        with safe_execute("Fetch videos without embedding"):
            sql = """
                SELECT video_id, title, description, tags, channel_title 
                FROM youtube_list 
                WHERE embedding IS NULL 
                LIMIT 50
            """
            videos = await fetch_all(sql)
        
        if not videos:
            print(f"✅ [Migration] All done! Total processed: {total_processed}")
            break

        print(f"📦 [Migration] Found {len(videos)} videos. Generating embeddings...")
        
        # 2. 텍스트 청크 생성
        texts = []
        for v in videos:
            try:
                tags = v['tags'] or ""
                desc = (v['description'] or "")[:300]
                ch = v['channel_title'] or ""
                title = v['title'] or ""
                text = f"{title} {ch} {tags} {desc}"
                texts.append(text)
            except Exception as e:
                print(f"⚠️ Text gen error for video {v.get('video_id')}: {e}")
                texts.append("") # Error handling
        
        # 3. 배치 임베딩 생성 (OpenAI API)
        from client.openai_client import get_embeddings_batch_openai
        # safe_execute 대신 직접 try-except (디버깅)
        try:
            embeddings = await get_embeddings_batch_openai(texts)
        except Exception as e:
             print(f"❌ [Migration] OpenAI Check: Is OPENAI_API_KEY set? Error: {e}")
             break
        
        if not embeddings:
            print("⚠️ [Migration] Failed to generate embeddings (Empty list returned).")
            # 0으로라도 채워서 무한루프 방지해야 함? 아니면 Break.
            # 여기서는 Break.
            break

        # 4. DB 업데이트 (하나씩)
        print(f"💾 [Migration] Saving {len(embeddings)} vectors to DB...")
        for i, vid in enumerate(videos):
            try:
                update_sql = "UPDATE youtube_list SET embedding = CAST(:embed AS vector) WHERE video_id = :vid"
                # embedding이 list[float]인지 확인
                vec = embeddings[i]
                if not vec or len(vec) != 1536:
                     print(f"⚠️ Invalid vector for {vid['video_id']}, len={len(vec) if vec else 0}")
                     continue
                     
                await execute(update_sql, {"embed": str(vec), "vid": vid['video_id']}) # Vector는 string으로 변환해서 넣는게 안전 (pgvector)
            except Exception as e:
                print(f"❌ [Migration] DB Update Error for {vid['video_id']}: {e}")
                
        total_processed += len(videos)
        
    print("🏁 [Migration] Workflow finished.")
    return total_processed

async def _process_channel_migration():
    """채널 데이터 벡터화 마이그레이션"""
    total_processed = 0
    while True:
        print("🔍 [Migration-Ch] Fetching NULL embedding channels...")
        with safe_execute("Fetch channels"):
            sql = "SELECT channel_id, name, keywords, description, category FROM youtube_channels WHERE embedding IS NULL LIMIT 50"
            channels = await fetch_all(sql)
            
        if not channels:
            print(f"✅ [Migration-Ch] All done! Total: {total_processed}")
            break
            
        print(f"📦 [Migration-Ch] Found {len(channels)} channels.")
        
        texts = []
        for c in channels:
            try:
                name = c['name'] or ""
                kw = c['keywords'] or ""
                desc = (c['description'] or "")[:300]
                cat = c['category'] or ""
                texts.append(f"{name} {kw} {cat} {desc}")
            except Exception:
                texts.append("")
                
        from client.openai_client import get_embeddings_batch_openai
        try:
            embeddings = await get_embeddings_batch_openai(texts)
        except Exception as e:
            print(f"❌ [Migration-Ch] API Error: {e}")
            break
            
        if not embeddings: break
        
        print(f"💾 [Migration-Ch] Saving...")
        for i, ch in enumerate(channels):
            try:
                sql = "UPDATE youtube_channels SET embedding = CAST(:embed AS vector) WHERE channel_id = :cid"
                vec = embeddings[i]
                if vec and len(vec) == 1536:
                    await execute(sql, {"embed": str(vec), "cid": ch['channel_id']})
            except Exception as e:
                print(f"❌ [Migration-Ch] DB Error {ch['channel_id']}: {e}")
                
        total_processed += len(channels)
        
    return total_processed

@router.post("/migrate/channels")
async def migrate_channels():
    """[Admin] 채널 데이터 벡터화"""
    print("🚀 [Migration-Ch] Start...")
    count = await _process_channel_migration()
    return {"message": f"Channel migration finished. Processed {count} channels."}
