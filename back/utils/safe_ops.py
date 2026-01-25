import json
import os
import requests

def load_json_safe(file_path: str, default_data: dict = None) -> dict:
    """
    JSON 파일을 안전하게 읽어옵니다. (예외 발생 시 기본값 반환)
    """
    if default_data is None:
        default_data = {}
        
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass 
        
    return default_data

def save_json_safe(file_path: str, data: dict):
    """
    데이터를 JSON 파일로 안전하게 저장합니다. (디렉토리 자동 생성)
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def append_json_line(file_path: str, data: dict):
    """
    데이터를 JSONL 라인 단위로 파일에 추가합니다.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'a', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
            f.write('\n')
    except Exception as e:
        print(f"Log append error: {e}")

def safe_http_get(url: str, headers: dict = None) -> tuple[dict, str]:
    """
    HTTP GET 요청을 안전하게 수행합니다.
    :return: (성공시_JSON데이터, 실패시_에러메시지) 튜플 반환
    """
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json(), None
        else:
            return None, f"API 호출 실패: {response.status_code}, 상세: {response.text}"
    except Exception as e:
        return None, f"네트워크 오류: {str(e)}"

from contextlib import contextmanager

@contextmanager
def safe_execute(error_msg="An error occurred"):
    """
    [Context Manager] 실행 중 예외가 발생해도 프로그램이 죽지 않도록 방어.
    Usage:
        with safe_execute("Description"):
            ... risky code ...
    """
    try:
        yield
    except Exception as e:
        print(f"⚠️ {error_msg}: {e}")
