from core.database import execute, fetch_one, fetch_all, insert_and_return
from novel.schemas import NovelCreate

async def create_novel(topic: str):
    """
    Create a new novel entry.
    Initially, the script might just be the topic or empty until generated.
    """
    # 임시 제목 생성
    title = f"Story: {topic[:20]}..." if len(topic) > 20 else f"Story: {topic}"
    
    sql = """
        INSERT INTO novels (title, script, created_at)
        VALUES (:title, :script, NOW())
        RETURNING id, title, script, created_at
    """
    # 우선 script에 topic을 저장해둠 (나중에 생성된 이야기로 업데이트 가능)
    return await insert_and_return(sql, {"title": title, "script": topic})

async def create_novel_cut(novel_id: int, cut_order: int, scene_desc: str, image_path: str):
    """
    Create a 4-cut scene entry.
    """
    sql = """
        INSERT INTO novel_cuts (novel_id, cut_order, scene_desc, image_path)
        VALUES (:novel_id, :cut_order, :scene_desc, :image_path)
        RETURNING id, novel_id, cut_order, scene_desc, image_path
    """
    return await insert_and_return(sql, {
        "novel_id": novel_id,
        "cut_order": cut_order,
        "scene_desc": scene_desc,
        "image_path": image_path
    })

async def get_novel(novel_id: int):
    """
    Get novel and its cuts.
    """
    sql = "SELECT id, title, script, created_at FROM novels WHERE id = :id"
    novel = await fetch_one(sql, {"id": novel_id})
    
    if not novel:
        return None
    
    sql_cuts = "SELECT id, novel_id, cut_order, scene_desc, image_path FROM novel_cuts WHERE novel_id = :id ORDER BY cut_order"
    cuts = await fetch_all(sql_cuts, {"id": novel_id})
    
    # 결과 합치기 (Dict로 반환하면 Router에서 Pydantic이 변환함)
    novel["cuts"] = cuts
    return novel

async def list_novels(limit: int = 20):
    sql = """
        SELECT n.id, n.title, n.script, n.created_at,
        (SELECT image_path FROM novel_cuts WHERE novel_id = n.id ORDER BY cut_order LIMIT 1) as thumbnail_image
        FROM novels n
        ORDER BY n.created_at DESC LIMIT :limit
    """
    return await fetch_all(sql, {"limit": limit})
