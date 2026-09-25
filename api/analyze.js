import {GoogleGenAI} from "@google/genai";

const schema={type:"object",properties:{
 symbol:{type:"string"},bias:{type:"string"},confidence:{type:"number"},
 summary:{type:"string"},
 entry:{type:"object",properties:{zone:{type:"string"}},required:["zone"]},
 stop_loss:{type:"string"},
 take_profit:{type:"array",items:{type:"string"}},
 bullish_scenario:{type:"string"},bearish_scenario:{type:"string"},
 invalidation:{type:"string"},risk_reward:{type:"string"}
},required:["symbol","bias","confidence","summary","entry","stop_loss","take_profit","bullish_scenario","bearish_scenario","invalidation","risk_reward"]};

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:"Gemini API key is not configured yet."});
 try{
  const {image,timeframe="15M",symbol="BTC/USDT"}=req.body||{};
  if(!image||typeof image!=="string"||!image.startsWith("data:image/"))return res.status(400).json({error:"A valid chart image is required."});
  const match=image.match(/^data:(image\\/(?:png|jpeg|webp));base64,(.+)$/);
  if(!match)return res.status(400).json({error:"Only PNG, JPG/JPEG and WEBP images are supported."});
  const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
  const prompt=`You are ChartPilot, an AI-assisted technical chart analysis engine. Analyze the supplied ${symbol} trading chart for the ${timeframe} timeframe. Do not claim certainty or guaranteed profit. Read only visible evidence. Return a structured analysis with market bias, key reasoning, an entry zone if a defensible setup exists, stop loss, up to three take-profit levels, bullish and bearish scenarios, invalidation, risk/reward and a 0-100 analytical confidence. If price values are unclear, say "Not reliably readable" rather than inventing numbers. This is decision support, not financial advice.`;
  const response=await ai.models.generateContent({model:"gemini-3.8-flash",contents:[{parts:[{text:prompt},{inlineData:{mimeType:match[1],data:match[2]}}]}],config:{responseMimeType:"application/json",responseSchema:schema}});
  const text=response.text||"{}"; const data=JSON.parse(text);
  return res.status(200).json(data);
 }catch(e){console.error(e);return res.status(500).json({error:"AI analysis failed. Please try again."})}
}