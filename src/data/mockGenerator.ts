import type { TowerState, WeatherData } from '../types'
const regions = [['Tehran',35.6892,51.389],['Karaj',35.84,50.9391],['Qom',34.6416,50.8746],['Qazvin',36.2688,50.0041]] as const
export const defaultWeather: WeatherData = { temperature: 28, precipitation: 0, windspeed: 12, weathercode: 1, condition: 'Clear' }
const random = (min:number,max:number) => Math.round(min + Math.random() * (max-min))
export function generateMockTowers(count=20): TowerState[] {
  return Array.from({length: Math.max(count,20)}, (_, index) => {
    const [region,lat,lng] = regions[index % regions.length]
    const isOld = index % 4 === 0
    const batteryLevel = random(25,100)
    return { id:`MOCK-${String(index+1).padStart(3,'0')}`, name:`${region}-${index+1}`, lat:lat+(Math.random()-.5)*.28, lng:lng+(Math.random()-.5)*.28, region, status:'online', signalStrength:random(72,99), packetLoss:Number((Math.random()*1.6).toFixed(1)), cpuTemp:random(28,40), connectedUsers:random(80,700), bandwidthUsageMbps:random(30,360), weather:defaultWeather, isGridPowerActive:true, batteryLevel, batteryHealth:isOld?random(70,85):random(86,100), estimatedRuntimeMinutes:null, outageStartedAt:null, installedAt:`${isOld?2020:2024}-01-01T00:00:00.000Z`, dataSource:'mock', lastUpdated:new Date().toISOString() }
  })
}
