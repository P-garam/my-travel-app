
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, TravelPlan } from "../types";

export const generateTravelPlan = async (profile: UserProfile): Promise<TravelPlan> => {
  // 호출 직전에 인스턴스 생성 (최신 API Key 반영 보장)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `당신은 세계적인 영화 감독이자 여행 큐레이터입니다.
    다음 데이터를 바탕으로 '실제 존재하는 명소'들로 구성된 명작 영화 같은 여행 시나리오를 작성해주세요:
    - 목적지: ${profile.destination}
    - 여행 시작일: ${profile.travelDate}
    - 기간: ${profile.duration}일
    - 사용자 정보: ${profile.age}세, ${profile.gender}, 취향(${profile.hobbies.join(', ')})

    [중요 지침]
    1. 실존 장소 엄수: 반드시 ${profile.destination}에 현재 운영 중인 실제 장소(식당, 카페, 명소 등)만 추천하세요. 가상의 장소는 금지됩니다.
    2. 정확한 주소: 'address' 필드에는 구글 맵에서 검색 가능한 해당 장소의 실제 상세 주소를 입력하세요.
    3. 영화적 연출: 'personalityTitle'과 'personalityDescription'은 한국어로 감각적으로 작성하세요.
    4. 언어: 모든 텍스트는 한국어로 작성하되, 'imageKeyword'만 영문 키워드 하나로 작성하세요.
    5. 시나리오 형식: 각 장소는 영화 시나리오의 한 장면(Scene)처럼 묘사하세요.
    6. OST 선곡: 이 여행의 분위기(Vibe)를 극대화할 수 있는 팝, 재즈, 혹은 현지 음악 등 실제 존재하는 곡 5개를 선정하여 'soundtrack' 리스트에 담으세요.
    7. 영화 추천 (사실성 필수): 
       - ${profile.destination}에서 촬영되었거나 배경인 영화를 우선 추천하세요.
       - 만약 정확히 해당 도시 배경의 영화가 없다면, 그 나라를 대표하거나 여행의 계절/분위기와 완벽하게 어울리는 명작을 추천하세요.
       - **절대 주의**: 영화의 촬영지나 내용에 대해 거짓 정보(Hallucination)를 생성하지 마세요. 추천 사유(reason)는 반드시 검증된 사실에 기반해야 합니다.
    8. 풍성한 일정: 하루 일정(Day Itinerary)은 아침, 점심, 오후 활동, 저녁 식사, 야간 활동(바, 야경 등)을 포함하여 하루 최소 4~5곳 이상의 장소로 알차게 구성하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personalityTitle: { type: Type.STRING },
            personalityDescription: { type: Type.STRING },
            vibeScore: { type: Type.NUMBER },
            totalEstimatedBudget: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            movies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  director: { type: Type.STRING },
                  year: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["title", "director", "year", "reason"]
              }
            },
            soundtrack: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["title", "artist", "reason"]
              }
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  places: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        address: { type: Type.STRING },
                        description: { type: Type.STRING },
                        docentScript: { type: Type.STRING },
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER },
                        imageKeyword: { type: Type.STRING },
                        estimatedCost: { type: Type.NUMBER },
                        bestTime: { type: Type.STRING },
                        outfitTip: { type: Type.STRING },
                        photoSpotTip: { type: Type.STRING }
                      },
                      required: ["name", "address", "description", "docentScript", "lat", "lng", "imageKeyword"]
                    }
                  }
                },
                required: ["day", "places"]
              }
            },
            localEtiquette: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["personalityTitle", "personalityDescription", "vibeScore", "itinerary", "totalEstimatedBudget", "localEtiquette", "soundtrack", "movies"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("모델로부터 응답 텍스트를 받지 못했습니다.");
    
    const cleanJson = text.replace(/```json\n?|```\n?/g, "").trim();
    
    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON 파싱 에러. 원본 텍스트:", text);
      throw new Error("시나리오 데이터를 읽는 중 형식이 맞지 않는 문제가 발생했습니다.");
    }
  } catch (error: any) {
    console.error("Gemini API 호출 중 상세 에러:", error);
    throw error;
  }
};
