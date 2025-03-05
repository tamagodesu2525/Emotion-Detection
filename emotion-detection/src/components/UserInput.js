// components/UserInput.js
import React, { useState } from 'react';
import './UserInput.css';
import EmotionMap from './EmotionMap';

const UserInput = ({ onSubmit }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [context, setContext] = useState('');
  
  // 感情マップでの選択を処理
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
  };
  
  // フォーム送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmotion) {
      alert('感情状態を選択してください');
      return;
    }
    
    onSubmit({
      ...selectedEmotion,
      context
    });
  };
  
  // 感情名を推定する関数
  const getEmotionName = (arousal, valence) => {
    if (!arousal || !valence) return '未選択';
    
    // 簡易的な感情名マッピング
    if (arousal > 0.3) {
      if (valence > 0.3) return '幸福/興奮';
      else if (valence < -0.3) return '怒り/恐怖';
      else return '覚醒/緊張';
    } else if (arousal < -0.3) {
      if (valence > 0.3) return 'リラックス/平穏';
      else if (valence < -0.3) return '悲しみ/憂鬱';
      else return '疲労/眠気';
    } else {
      if (valence > 0.3) return '満足/喜び';
      else if (valence < -0.3) return '不満/失望';
      else return '平静/無感情';
    }
  };

  return (
    <div className="user-input-container">
      <h2>あなたの現在の感情状態を教えてください</h2>
      
      <EmotionMap 
        selectable={true}
        onSelection={handleEmotionSelection}
        userPoint={selectedEmotion}
      />
      
      {selectedEmotion && (
        <div className="selected-emotion">
          <p>選択した感情: <strong>{getEmotionName(selectedEmotion.arousal, selectedEmotion.valence)}</strong></p>
          <p>
            覚醒度: {selectedEmotion.arousal.toFixed(2)} / 
            感情価: {selectedEmotion.valence.toFixed(2)}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="context">コンテキスト (任意):</label>
          <textarea 
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="今の感情に関連する状況や要因があれば入力してください"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={!selectedEmotion}
        >
          送信
        </button>
      </form>
    </div>
  );
};

export default UserInput;