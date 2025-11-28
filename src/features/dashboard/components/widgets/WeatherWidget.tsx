/**
 * WeatherWidget Component
 *
 * Widget météo utilisant l'API Open-Meteo (gratuite, sans clé API)
 * Affiche la météo actuelle et les prévisions sur 5 jours
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  MapPin,
  CloudDrizzle,
  Cloudy,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

interface WeatherWidgetProps {
  title?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  showForecast?: boolean;
  refreshInterval?: number; // en minutes
}

interface WeatherData {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: {
    date: Date;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
  }[];
}

// ============================================================================
// WEATHER CODE MAPPING
// ============================================================================

const getWeatherInfo = (
  code: number,
  isDay: boolean = true
): { icon: React.ReactNode; label: string } => {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  const iconSize = 24;
  const iconClass = 'text-current';

  switch (code) {
    case 0: // Clear sky
      return {
        icon: (
          <Sun
            size={iconSize}
            className={cn(iconClass, isDay ? 'text-yellow-500' : 'text-slate-300')}
          />
        ),
        label: 'Ciel dégagé',
      };
    case 1: // Mainly clear
      return {
        icon: <Sun size={iconSize} className={cn(iconClass, 'text-yellow-400')} />,
        label: 'Peu nuageux',
      };
    case 2: // Partly cloudy
      return {
        icon: <Cloudy size={iconSize} className={cn(iconClass, 'text-gray-400')} />,
        label: 'Partiellement nuageux',
      };
    case 3: // Overcast
      return {
        icon: <Cloud size={iconSize} className={cn(iconClass, 'text-gray-500')} />,
        label: 'Couvert',
      };
    case 45: // Fog
    case 48: // Depositing rime fog
      return {
        icon: <CloudFog size={iconSize} className={cn(iconClass, 'text-gray-400')} />,
        label: 'Brouillard',
      };
    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
      return {
        icon: <CloudDrizzle size={iconSize} className={cn(iconClass, 'text-blue-400')} />,
        label: 'Bruine',
      };
    case 56: // Light freezing drizzle
    case 57: // Dense freezing drizzle
      return {
        icon: <CloudDrizzle size={iconSize} className={cn(iconClass, 'text-blue-300')} />,
        label: 'Bruine verglaçante',
      };
    case 61: // Slight rain
      return {
        icon: <CloudRain size={iconSize} className={cn(iconClass, 'text-blue-500')} />,
        label: 'Pluie légère',
      };
    case 63: // Moderate rain
      return {
        icon: <CloudRain size={iconSize} className={cn(iconClass, 'text-blue-600')} />,
        label: 'Pluie modérée',
      };
    case 65: // Heavy rain
      return {
        icon: <CloudRain size={iconSize} className={cn(iconClass, 'text-blue-700')} />,
        label: 'Pluie forte',
      };
    case 66: // Light freezing rain
    case 67: // Heavy freezing rain
      return {
        icon: <CloudRain size={iconSize} className={cn(iconClass, 'text-cyan-500')} />,
        label: 'Pluie verglaçante',
      };
    case 71: // Slight snow
      return {
        icon: <CloudSnow size={iconSize} className={cn(iconClass, 'text-slate-400')} />,
        label: 'Neige légère',
      };
    case 73: // Moderate snow
      return {
        icon: <CloudSnow size={iconSize} className={cn(iconClass, 'text-slate-500')} />,
        label: 'Neige modérée',
      };
    case 75: // Heavy snow
      return {
        icon: <CloudSnow size={iconSize} className={cn(iconClass, 'text-slate-600')} />,
        label: 'Neige forte',
      };
    case 77: // Snow grains
      return {
        icon: <CloudSnow size={iconSize} className={cn(iconClass, 'text-slate-400')} />,
        label: 'Grains de neige',
      };
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return {
        icon: <CloudRain size={iconSize} className={cn(iconClass, 'text-blue-500')} />,
        label: 'Averses',
      };
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return {
        icon: <CloudSnow size={iconSize} className={cn(iconClass, 'text-slate-500')} />,
        label: 'Averses de neige',
      };
    case 95: // Thunderstorm
      return {
        icon: <CloudLightning size={iconSize} className={cn(iconClass, 'text-yellow-600')} />,
        label: 'Orage',
      };
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return {
        icon: <CloudLightning size={iconSize} className={cn(iconClass, 'text-yellow-700')} />,
        label: 'Orage avec grêle',
      };
    default:
      return {
        icon: <Cloud size={iconSize} className={cn(iconClass, 'text-gray-400')} />,
        label: 'Variable',
      };
  }
};

const getLargeWeatherIcon = (code: number, isDay: boolean = true): React.ReactNode => {
  const iconSize = 48;

  switch (code) {
    case 0:
      return <Sun size={iconSize} className={isDay ? 'text-yellow-500' : 'text-slate-300'} />;
    case 1:
      return <Sun size={iconSize} className="text-yellow-400" />;
    case 2:
      return <Cloudy size={iconSize} className="text-gray-400" />;
    case 3:
      return <Cloud size={iconSize} className="text-gray-500" />;
    case 45:
    case 48:
      return <CloudFog size={iconSize} className="text-gray-400" />;
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return <CloudDrizzle size={iconSize} className="text-blue-400" />;
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return <CloudRain size={iconSize} className="text-blue-500" />;
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return <CloudSnow size={iconSize} className="text-slate-500" />;
    case 95:
    case 96:
    case 99:
      return <CloudLightning size={iconSize} className="text-yellow-600" />;
    default:
      return <Cloud size={iconSize} className="text-gray-400" />;
  }
};

// ============================================================================
// JOUR DE LA SEMAINE
// ============================================================================

const getDayName = (date: Date): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[date.getDay()];
};

// ============================================================================
// COMPOSANT
// ============================================================================

export const WeatherWidget = ({
  title = 'Météo',
  location = 'Paris, France',
  latitude = 48.8566, // Paris par défaut
  longitude = 2.3522,
  showForecast = true,
  refreshInterval = 30, // 30 minutes par défaut
}: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '5',
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données météo');
      }

      const data = await response.json();

      const weatherData: WeatherData = {
        current: {
          temperature: Math.round(data.current.temperature_2m),
          apparentTemperature: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
        },
        daily: data.daily.time.map((time: string, index: number) => ({
          date: new Date(time),
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weather_code[index],
        })),
      };

      setWeather(weatherData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  // Fetch initial + intervalle de rafraîchissement
  useEffect(() => {
    fetchWeather();

    const interval = setInterval(fetchWeather, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather, refreshInterval]);

  // ============================================================================
  // RENDU - LOADING
  // ============================================================================

  if (isLoading && !weather) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {showForecast && (
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 flex-1 rounded" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDU - ERREUR
  // ============================================================================

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cloud size={16} className="text-gray-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
          <p className="text-sm text-muted-foreground text-center">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchWeather}>
            <RefreshCw size={14} className="mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const currentWeather = getWeatherInfo(weather.current.weatherCode, weather.current.isDay);

  // ============================================================================
  // RENDU - MÉTÉO
  // ============================================================================

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {currentWeather.icon}
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchWeather}
            disabled={isLoading}
          >
            <RefreshCw size={12} className={cn(isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Météo actuelle */}
        <div className="flex items-center gap-4">
          {getLargeWeatherIcon(weather.current.weatherCode, weather.current.isDay)}
          <div>
            <p className="text-3xl font-bold">{weather.current.temperature}°C</p>
            <p className="text-sm text-muted-foreground">{currentWeather.label}</p>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Thermometer size={12} />
            <span>Ressenti {weather.current.apparentTemperature}°</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Droplets size={12} />
            <span>{weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wind size={12} />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span>{location}</span>
        </div>

        {/* Prévisions */}
        {showForecast && weather.daily.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Prévisions</p>
            <div className="grid grid-cols-5 gap-1">
              {weather.daily.map((day, index) => {
                const dayWeather = getWeatherInfo(day.weatherCode);
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center p-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-medium">
                      {index === 0 ? 'Auj.' : getDayName(day.date)}
                    </span>
                    <div className="my-1">{dayWeather.icon}</div>
                    <div className="text-xs">
                      <span className="font-medium">{day.tempMax}°</span>
                      <span className="text-muted-foreground ml-1">{day.tempMin}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dernière mise à jour */}
        {lastUpdate && (
          <p className="text-[10px] text-muted-foreground text-right">
            Mis à jour à{' '}
            {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
