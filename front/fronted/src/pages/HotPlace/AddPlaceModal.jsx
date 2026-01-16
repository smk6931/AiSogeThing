import { useState } from 'react';
import { Search, MapPin, Plus, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ApiInfo from '../../components/common/ApiInfo'; // API 정보 컴포넌트 추가
import './AddPlaceModal.css';

export default function AddPlaceModal({ isOpen, onClose, onAddPlace }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [quota, setQuota] = useState(null); // API 사용량 정보

  // 실제 백엔드 API 호출
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    setResults([]); // 기존 결과 초기화

    try {
      // Python Backend (FastAPI) 호출
      const response = await fetch(`http://localhost:8001/api/search?query=${keyword}`);
      const data = await response.json();

      if (data.items) {
        setResults(data.items);
        if (data.meta) setQuota(data.meta); // API 사용량 정보 저장
      } else if (data.error) {
        alert("검색 실패: " + data.error);
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("백엔드 서버가 켜져있는지 확인해주세요! (Port 8001)");
    } finally {
      setIsSearching(false);
    }
  };

  // HTML 태그 제거 함수 (네이버 API는 <b>태그를 줘서 제거 필요)
  const removeTags = (str) => str.replace(/(<([^>]+)>)/ig, "");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h3>핫플 장소 등록</h3>

          {/* API 정보 표시 (항상 표시하되 데이터 없으면 로딩중) */}
          <div className="modal-api-info">
            <ApiInfo remaining={quota?.remaining} limit={quota?.limit} />
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSearch} className="modal-search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="장소명 입력 (예: 성수 다락)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>
          <Button size="small" type="submit" disabled={isSearching}>
            {isSearching ? '검색 중...' : '검색'}
          </Button>
        </form>

        <div className="search-results">
          {results.length === 0 && !isSearching && (
            <div className="empty-state">
              <MapPin size={32} opacity={0.3} />
              <p>장소를 검색하여 지도에 추가해보세요.<br />(네이버 검색 API 연동됨)</p>
            </div>
          )}

          {results.map((place, index) => (
            <div key={index} className="search-item">
              <div className="search-item-info">
                <h4 className="search-item-title">{removeTags(place.title)}</h4>
                <p className="search-item-addr">{place.address}</p>
                <span className="search-item-cate">{place.category}</span>
              </div>
              <button
                className="add-place-btn"
                onClick={() => onAddPlace({
                  name: removeTags(place.title),
                  desc: '내가 추천하는 핫한 장소! 👍',
                  category: place.category.split('>')[1] || place.category,
                  position: [place.lat, place.lng],
                  rating: 5.0,
                  naverUrl: place.naver_map_url
                })}
              >
                <Plus size={16} /> 추가
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
