// components/ComparisonView.js
import React from 'react';
import './ComparisonView.css';
import EmotionMap from './EmotionMap';

const ComparisonView = ({ 
  predictedEmotion, 
  userEmotion, 
  comparisonResult,
  onReset
}) => {
  // 感情名を推定する関数
  const getEmotionName = (arousal, valence) => {
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
  
  // ギャップの大きさに基づくクラス名
  const getGapClassName = (gap) => {
    if (gap > 0.6) return 'large-gap';
    if (gap > 0.3) return 'medium-gap';
    return 'small-gap';
  };

  return (
    <div className="comparison-view-container">
      <h2>感情状態の比較結果</h2>
      
      <EmotionMap 
        predictedPoint={predictedEmotion}
        userPoint={userEmotion}
      />
      
      <div className="comparison-details">
        <div className="comparison-column">
          <h3>あなたの認識</h3>
          <p className="emotion-name">{getEmotionName(userEmotion.arousal, userEmotion.valence)}</p>
          <p>覚醒度: {userEmotion.arousal.toFixed(2)}</p>
          <p>感情価: {userEmotion.valence.toFixed(2)}</p>
          {userEmotion.context && (
            <div className="context-box">
              <h4>入力したコンテキスト:</h4>
              <p>{userEmotion.context}</p>
            </div>
          )}
        </div>
        
        <div className="comparison-column">
          <h3>生体データからの予測</h3>
          <p className="emotion-name">{getEmotionName(predictedEmotion.arousal, predictedEmotion.valence)}</p>
          <p>覚醒度: {predictedEmotion.arousal.toFixed(2)}</p>
          <p>感情価: {predictedEmotion.valence.toFixed(2)}</p>
          <div className="metrics-box">
            <h4>生体指標:</h4>
            <p>心拍数: {predictedEmotion.metrics.heartRate} bpm</p>
            <p>HRV: {predictedEmotion.metrics.hrv} ms</p>
            <p>EDA: {predictedEmotion.metrics.eda} μS</p>
          </div>
        </div>
      </div>
      
      <div className="gap-analysis">
        <h3>ギャップ分析</h3>
        <div className={`gap-item ${getGapClassName(comparisonResult.arousalGap)}`}>
          <span className="gap-label">覚醒度のギャップ:</span>
          <span className="gap-value">{comparisonResult.arousalGap.toFixed(2)}</span>
        </div>
        <div className={`gap-item ${getGapClassName(comparisonResult.valenceGap)}`}>
          <span className="gap-label">感情価のギャップ:</span>
          <span className="gap-value">{comparisonResult.valenceGap.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="insights-section">
        <h3>インサイト</h3>
        <ul className="insights-list">
          {comparisonResult.insights.map((insight, index) => (
            <li key={index} className="insight-item">{insight}</li>
          ))}
        </ul>
      </div>
      
      {comparisonResult.hasSignificantGap && (
        <div className="recommendations">
          <h3>推奨アクション</h3>
          <ul>
            <li>深呼吸を5回行い、体の状態に意識を向けてみましょう</li>
            <li>感情と体の状態のギャップが生じる原因を考えてみましょう</li>
            <li>定期的に感情状態をチェックして、自己認識を高めましょう</li>
          </ul>
        </div>
      )}
      
      <button 
        className="reset-button"
        onClick={onReset}
      >
        新しい計測を始める
      </button>
    </div>
  );
};

export default ComparisonView;