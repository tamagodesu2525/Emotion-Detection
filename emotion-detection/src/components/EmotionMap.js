// components/EmotionMap.js
import React, { useEffect, useState } from 'react';
import './EmotionMap.css';

// 感情の2次元マップ（Arousal×Valence）
const EmotionMap = ({ 
  predictedPoint = null, 
  userPoint = null, 
  selectable = false, 
  onSelection = () => {} 
}) => {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const mapRef = React.useRef(null);
  
  // コンポーネントがマウントされたら、マップのサイズを取得
  useEffect(() => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMapSize({ width: rect.width, height: rect.height });
    }
  }, []);

  // マップ上の座標をArousal/Valence値に変換する関数
  const mapCoordinatesToValues = (x, y) => {
    if (!mapRef.current) return { arousal: 0, valence: 0 };
    
    const rect = mapRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const valence = (x - centerX) / (rect.width / 2);
    const arousal = (centerY - y) / (rect.height / 2);
    
    return { 
      arousal: Math.max(-1, Math.min(1, arousal)), 
      valence: Math.max(-1, Math.min(1, valence)) 
    };
  };
  
  // マップ上でのクリックイベント
  const handleMapClick = (e) => {
    if (!selectable || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const values = mapCoordinatesToValues(x, y);
    onSelection(values);
  };
  
  // 感情の位置を表示するためのヘルパー関数（Arousal/Valenceから画面座標に変換）
  const calculatePosition = (arousal, valence) => {
    if (!mapRef.current) return { x: 0, y: 0 };

    const rect = mapRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 座標値を-1〜1の範囲に制限
    const safeArousal = Math.max(-1, Math.min(1, arousal));
    const safeValence = Math.max(-1, Math.min(1, valence));
    
    const x = centerX + safeValence * (rect.width / 2);
    const y = centerY - safeArousal * (rect.height / 2);
    
    return { x, y };
  };
  
  // 感情ラベルの位置
  const emotionLabels = [
    { label: '興奮', arousal: 0.85, valence: 0 },
    { label: '幸福', arousal: 0.6, valence: 0.6 },
    { label: '満足', arousal: 0, valence: 0.85 },
    { label: 'リラックス', arousal: -0.6, valence: 0.6 },
    { label: '退屈', arousal: -0.85, valence: 0 },
    { label: '悲しみ', arousal: -0.6, valence: -0.6 },
    { label: '不安', arousal: 0.6, valence: -0.6 },
    { label: '怒り', arousal: 0.7, valence: -0.7 },
  ];

  return (
    <div className="emotion-map-container">
      <div 
        className="emotion-map" 
        ref={mapRef}
        onClick={handleMapClick}
      >
        {/* 軸 */}
        <div className="x-axis"></div>
        <div className="y-axis"></div>
        
        {/* 軸ラベル */}
        <div className="axis-label x-positive">ポジティブ</div>
        <div className="axis-label x-negative">ネガティブ</div>
        <div className="axis-label y-positive">高覚醒</div>
        <div className="axis-label y-negative">低覚醒</div>
        
        {/* 感情ラベル */}
        {emotionLabels.map((item, index) => {
          const pos = calculatePosition(item.arousal, item.valence);
          return (
            <div 
              key={index} 
              className="emotion-label"
              style={{ 
                left: `${pos.x}px`,
                top: `${pos.y}px`
              }}
            >
              {item.label}
            </div>
          );
        })}
        
        {/* デバッグ情報（開発時のみ表示） */}
        {/* {predictedPoint && (
          <div className="debug-info">
            予測: Arousal={predictedPoint.arousal.toFixed(2)}, Valence={predictedPoint.valence.toFixed(2)}
          </div>
        )}
        {userPoint && (
          <div className="debug-info" style={{top: '20px'}}>
            ユーザー: Arousal={userPoint.arousal.toFixed(2)}, Valence={userPoint.valence.toFixed(2)}
          </div>
        )} */}
        
        {/* 予測された感情ポイント */}
        {predictedPoint && (
          <div 
            className="emotion-point predicted"
            style={{ 
              left: `${calculatePosition(predictedPoint.arousal, predictedPoint.valence).x}px`,
              top: `${calculatePosition(predictedPoint.arousal, predictedPoint.valence).y}px`
            }}
            title="予測された感情状態"
          ></div>
        )}
        
        {/* ユーザー入力の感情ポイント */}
        {userPoint && (
          <div 
            className="emotion-point user"
            style={{ 
              left: `${calculatePosition(userPoint.arousal, userPoint.valence).x}px`,
              top: `${calculatePosition(userPoint.arousal, userPoint.valence).y}px`
            }}
            title="あなたが感じている感情状態"
          ></div>
        )}
        
        {/* 選択可能な場合のインストラクション */}
        {selectable && (
          <div className="map-instruction">
            マップ上でクリックして、現在のあなたの感情状態を選択してください
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionMap;