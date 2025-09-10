'use client';

import React, { useState } from 'react';

const CalorieCalculator: React.FC = () => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [activity, setActivity] = useState<string>('1.5');
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);

  const calculateBMR = () => {
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const activityNum = parseFloat(activity);

    if (!ageNum || !heightNum || !weightNum) {
      alert('すべての項目を入力してください');
      return;
    }

    let calculatedBMR: number;
    if (gender === 'male') {
      calculatedBMR = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      calculatedBMR = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }

    const calculatedTDEE = calculatedBMR * activityNum;
    
    setBmr(Math.round(calculatedBMR));
    setTdee(Math.round(calculatedTDEE));
  };

  return (
    <section id="calculator" className="min-h-screen flex items-center bg-gray-50 py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            基礎代謝量<span className="text-orange-600">算出</span>
          </h2>
          <p className="text-lg text-gray-600">
            あなたに必要なカロリーを計算します
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">性別</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    gender === 'male' 
                      ? 'border-orange-600 bg-orange-600 text-white' 
                      : 'border-gray-200 text-gray-700 hover:border-orange-600'
                  }`}
                >
                  男性
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    gender === 'female' 
                      ? 'border-orange-600 bg-orange-600 text-white' 
                      : 'border-gray-200 text-gray-700 hover:border-orange-600'
                  }`}
                >
                  女性
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">年齢</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="例: 30"
                className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">身長 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例: 170"
                className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">体重 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例: 60"
                className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-gray-700 font-semibold mb-2">活動レベル</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 focus:border-orange-600 focus:outline-none"
            >
              <option value="1.2">座位中心の生活</option>
              <option value="1.375">軽い運動習慣あり</option>
              <option value="1.5">週3-5日の運動</option>
              <option value="1.725">毎日運動する</option>
              <option value="1.9">激しい運動を毎日</option>
            </select>
          </div>

          <button
            onClick={calculateBMR}
            className="w-full mt-8 bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors"
          >
            計算する
          </button>

          {bmr && tdee && (
            <div className="mt-8 p-6 bg-orange-50 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">計算結果</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">基礎代謝量:</span>
                  <span className="text-2xl font-bold text-orange-600">{bmr} kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">1日の必要カロリー:</span>
                  <span className="text-2xl font-bold text-orange-600">{tdee} kcal</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                ※ 体重を増やすには、この値より多くのカロリーを摂取する必要があります。
                ふとるめしなら、1食600kcal以上の高カロリー食で効率的に栄養補給できます。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CalorieCalculator;