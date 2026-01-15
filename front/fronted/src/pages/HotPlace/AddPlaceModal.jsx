import { useState } from 'react';
import { Search, MapPin, Plus, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import './AddPlaceModal.css';

export default function AddPlaceModal({ isOpen, onClose, onAddPlace }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 네이버 API 연동 전 테스트를 위한 가짜 검색 함수
  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);

    // TODO: 나중에 여기에 백엔드 API 호출 루틴이 들어갑니다.
    // fetch(`/api/naver/search?query=${keyword}`)...

    setTimeout(() => {
      // 임시 검색 결과 (테스트용)
      const mockResults = [
        {
          title: `<b>${keyword}</b> 성수점`,
          address: '서울 성동구 성수동 1가 12-3',
          mapx: 127056000, // 네이버는 좌표를 이상한 정수로 줄 때가 있어 변환 필요 (여기선 위경도 예시)
          // 실제 위경도 시뮬레이션 (성수역 근처 랜덤)
          lat: 37.5445 + (Math.random() - 0.5) * 0.01,
          lng: 127.0560 + (Math.random() - 0.5) * 0.01,
          category: '음식점>카페'
        },
        {
          title: `<b>${keyword}</b> 본점`,
          address: '서울 강남구 역삼동 123',
          lat: 37.5000 + (Math.random() - 0.5) * 0.01,
          lng: 127.0300 + (Math.random() - 0.5) * 0.01,
          category: '음식점>한식'
        }
      ];
      setResults(mockResults);
      setIsSearching(false);
    }, 800);
  };

  // HTML 태그 제거 함수 (네이버 API는 <b>태그를 줘서 제거 필요)
  const removeTags = (str) => str.replace(/(<([^>]+)>)/ig, "");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h3>핫플 장소 등록</h3>
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
              <p>장소를 검색하여 지도에 추가해보세요.<br />(네이버 검색 API 연동 예정)</p>
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
                  desc: '내가 추천하는 핫한 장소! 👍', // 유저 입력 폼 추가 가능
                  category: place.category.split('>')[1] || '기타',
                  position: [place.lat, place.lng],
                  rating: 5.0,
                  naverUrl: `https://map.naver.com/p/search/${removeTags(place.title)}`
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
