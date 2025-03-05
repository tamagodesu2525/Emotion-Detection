// utils/dataSimulation.js

// ランダムなセンサーデータを生成する関数
export const generateRandomData = () => {
    // 現実的な範囲内でランダムな値を生成
    const heartRate = Math.floor(60 + Math.random() * 40); // 60-100 bpm
    const hrv = Math.floor(20 + Math.random() * 60); // 20-80 ms
    const eda = (2 + Math.random() * 8).toFixed(2); // 2-10 μS
    
    return {
      timestamp: new Date().toISOString(),
      heartRate,
      hrv,
      eda: parseFloat(eda)
    };
  };
  
  // APIを使用して感情予測を行う関数
  export const predictEmotionWithAPI = async (sensorData) => {
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heartRate: sensorData.heartRate,
          eda: sensorData.eda
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Prediction error: ${result.error}`);
      }
      
      console.log(`API Prediction: Arousal=${result.arousal.toFixed(2)}, Valence=${result.valence.toFixed(2)}`);
      
      return {
        arousal: result.arousal,
        valence: result.valence,
        metrics: {
          heartRate: sensorData.heartRate,
          hrv: sensorData.hrv,
          eda: sensorData.eda
        }
      };
    } catch (error) {
      console.error('Error predicting emotion with API:', error);
      // APIエラーの場合はフォールバック予測を使用
      console.warn('Falling back to simulation prediction');
      return predictEmotion(sensorData);
    }
  };
  
  // ローカルシミュレーションによる感情予測（APIフォールバック用）
  export const predictEmotion = (sensorData) => {
    // 簡易的な計算ロジック
    // HRVが高いとリラックス状態（低覚醒・ポジティブ）
    // 心拍数が高いと興奮状態（高覚醒）
    // EDAが高いとストレス反応（高覚醒・ネガティブ寄り）
    
    // 心拍数を覚醒度に変換（心拍数が高いほど覚醒度が高い）
    // 60bpm->-0.6, 100bpm->0.6の範囲にマッピング
    const arousalFromHR = ((sensorData.heartRate - 60) / 40) * 1.2 - 0.6;
    
    // HRVを覚醒度に変換（HRVが高いほど覚醒度が低い）
    // 20ms->0.4, 80ms->-0.4の範囲にマッピング
    const arousalFromHRV = 0.4 - ((sensorData.hrv - 20) / 60) * 0.8;
    
    // EDAを覚醒度に変換（EDAが高いほど覚醒度が高い）
    // 2μS->-0.4, 10μS->0.4の範囲にマッピング
    const arousalFromEDA = ((sensorData.eda - 2) / 8) * 0.8 - 0.4;
    
    // 三つの指標から加重平均で覚醒度を計算
    const arousal = (arousalFromHR * 0.3 + arousalFromHRV * 0.4 + arousalFromEDA * 0.3);
    
    // 感情価（Valence）の計算
    // HRVが高いほどポジティブ、EDAが高いほどネガティブと仮定
    const valenceFromHRV = ((sensorData.hrv - 20) / 60) * 0.8 - 0.1;
    const valenceFromEDA = 0.2 - ((sensorData.eda - 2) / 8) * 0.6;
    
    // 心拍数の変動も考慮（70-80bpmが最もポジティブと仮定）
    const optimalHR = 75;
    const hrDiff = Math.abs(sensorData.heartRate - optimalHR);
    const valenceFromHR = 0.3 - (hrDiff / 25) * 0.4;
    
    // 三つの指標から加重平均で感情価を計算
    const valence = (valenceFromHRV * 0.4 + valenceFromEDA * 0.3 + valenceFromHR * 0.3);
    
    // ランダム性を加えて多様な結果になるよう調整（-0.8〜0.8の範囲に制限）
    const randomFactor = 0.2;
    const adjustedArousal = Math.max(-0.8, Math.min(0.8, arousal + (Math.random() - 0.5) * randomFactor));
    const adjustedValence = Math.max(-0.8, Math.min(0.8, valence + (Math.random() - 0.5) * randomFactor));
    
    console.log(`Fallback Simulation: Arousal=${adjustedArousal.toFixed(2)}, Valence=${adjustedValence.toFixed(2)}`);
  
    return {
      arousal: adjustedArousal,
      valence: adjustedValence,
      metrics: {
        heartRate: sensorData.heartRate,
        hrv: sensorData.hrv,
        eda: sensorData.eda
      }
    };
  };