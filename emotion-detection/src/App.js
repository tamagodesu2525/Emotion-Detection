// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import EmotionMap from './components/EmotionMap';
import UserInput from './components/UserInput';
import ComparisonView from './components/ComparisonView';
import { generateRandomData, predictEmotion, predictEmotionWithAPI } from './utils/dataSimulation';

function App() {
  // 状態管理
  const [sensorData, setSensorData] = useState(null);
  const [predictedEmotion, setPredictedEmotion] = useState(null);
  const [userEmotion, setUserEmotion] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'input', 'comparison'
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [error, setError] = useState(null);

  // 起動時にAPIサーバーが利用可能かチェック
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setApiAvailable(true);
          console.log('API server is available');
        } else {
          setApiAvailable(false);
          console.warn('API server responded with an error');
        }
      } catch (error) {
        setApiAvailable(false);
        console.warn('API server is not available:', error);
      }
    };
    
    checkApiAvailability();
  }, []);

  // ランダムデータ生成と感情予測
  const generateData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = generateRandomData();
      setSensorData(data);
      
      // 予測モデル実行（APIまたはフォールバック）
      let prediction;
      if (apiAvailable) {
        prediction = await predictEmotionWithAPI(data);
      } else {
        prediction = predictEmotion(data);
      }
      
      setPredictedEmotion(prediction);
      
      // 入力画面へ遷移
      setCurrentView('input');
    } catch (err) {
      console.error('Error generating data:', err);
      setError('データの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー入力の処理
  const handleUserInput = (emotion) => {
    setUserEmotion(emotion);
    
    // 比較結果の生成
    const comparison = {
      arousalGap: Math.abs(emotion.arousal - predictedEmotion.arousal),
      valenceGap: Math.abs(emotion.valence - predictedEmotion.valence),
      hasSignificantGap: false,
      insights: []
    };
    
    // ギャップの分析
    if (comparison.arousalGap > 0.3 || comparison.valenceGap > 0.3) {
      comparison.hasSignificantGap = true;
      
      if (comparison.arousalGap > 0.3) {
        comparison.insights.push(
          predictedEmotion.arousal > emotion.arousal 
            ? "あなたが感じているより、体はより興奮状態にあるようです。" 
            : "あなたは興奮していると感じていますが、体はより落ち着いています。"
        );
      }
      
      if (comparison.valenceGap > 0.3) {
        comparison.insights.push(
          predictedEmotion.valence > emotion.valence 
            ? "あなたが認識しているより、体はよりポジティブな状態を示しています。" 
            : "あなたはポジティブに感じていますが、体はストレス反応を示しています。"
        );
      }
    } else {
      comparison.insights.push("あなたの感情認識は体の状態とよく一致しています。");
    }
    
    setComparisonResult(comparison);
    setCurrentView('comparison');
  };

  const resetApp = () => {
    setSensorData(null);
    setPredictedEmotion(null);
    setUserEmotion(null);
    setComparisonResult(null);
    setCurrentView('main');
    setError(null);
  };

  // 画面レンダリング
  return (
    <div className="App">
      <header className="App-header">
        <h1>EmotionDetection</h1>
        {apiAvailable ? (
          <div className="api-status api-available">APIサーバー接続中（モデル予測）</div>
        ) : (
          <div className="api-status api-unavailable">APIサーバー未接続（シミュレーション予測）</div>
        )}
      </header>
      
      <main>
        {currentView === 'main' && (
          <div className="main-view">
            <p>あなたの感情状態を計測します。</p>
            {error && <div className="error-message">{error}</div>}
            <button 
              onClick={generateData} 
              className="generate-button"
              disabled={isLoading}
            >
              {isLoading ? '計測中...' : '計測開始'}
            </button>
          </div>
        )}
        
        {currentView === 'input' && predictedEmotion && (
          <UserInput 
            onSubmit={handleUserInput} 
          />
        )}
        
        {currentView === 'comparison' && predictedEmotion && userEmotion && comparisonResult && (
          <ComparisonView 
            predictedEmotion={predictedEmotion} 
            userEmotion={userEmotion} 
            comparisonResult={comparisonResult}
            onReset={resetApp}
          />
        )}
      </main>
    </div>
  );
}

export default App;