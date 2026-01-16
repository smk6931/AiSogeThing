import json
import os

def load_json_safe(file_path: str, default_data: dict = None) -> dict:
    """
    JSON 파일을 안전하게 읽어옵니다. 파일이 없거나 에러 발생 시 default_data를 반환합니다.
    """
    if default_data is None:
        default_data = {}
        
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass # 로그를 남기거나 무시
        
    return default_data

def save_json_safe(file_path: str, data: dict):
    """
    데이터를 JSON 파일로 안전하게 저장합니다.
    """
    try:
        # 디렉토리가 없으면 생성
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
