import { useEffect, useState } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, TramFront, Ship, Bus } from 'lucide-react';

export interface RouteData {
  id: string;
  name: string;
  color: string;
  time?: string;
  cost?: string;
  greenScore?: number;
  sustainability?: string;
  waypoints: [number, number][]; // [lng, lat][]
}

export default function AppMap({ routes = [], selectedRouteId }: { routes?: RouteData[], selectedRouteId?: string | null }) {
  const [geojsons, setGeojsons] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch real road geometries for each route
    routes.forEach(async (route) => {
      if (route.waypoints.length < 2) return;
      
      const coords = route.waypoints.map(p => `${p[0]},${p[1]}`).join(';');
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson`);
        if (!res.ok) throw new Error("OSRM failed");
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          setGeojsons(prev => ({
            ...prev,
            [route.id]: {
              type: 'Feature',
              properties: {},
              geometry: data.routes[0].geometry
            }
          }));
        } else {
           throw new Error("No routes in OSRM");
        }
      } catch (err) {
        console.error("Using straight lines for", route.name);
        setGeojsons(prev => ({
          ...prev,
          [route.id]: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.waypoints
            }
          }
        }));
      }
    });
  }, [routes]);

  // Use the bounding box of all waypoints to recenter the map? (optional)

  return (
    <Map
      initialViewState={{
        longitude: 88.3639,
        latitude: 22.5726,
        zoom: 12.5,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="bottom-right" />

      {/* Render Markers for all waypoints */}
      {routes.flatMap(r => r.waypoints.map(wp => ({ wp, route: r }))).map((item, i) => {
        const isSelected = selectedRouteId ? item.route.id === selectedRouteId : true;
        return (
          <Marker key={`marker-${i}`} longitude={item.wp[0]} latitude={item.wp[1]} anchor="bottom">
            <div 
              className={`p-1 rounded-full shadow-lg border-2 border-white translate-y-1 transition-all ${isSelected ? 'scale-100 opacity-100' : 'scale-75 opacity-40'}`}
              style={{ backgroundColor: item.route.color || '#1e293b' }}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </Marker>
        );
      })}

      {/* Render Route Lines */}
      {routes.map((route, i) => {
        const geojson = geojsons[route.id] || {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.waypoints
          }
        };

        const isSelected = selectedRouteId ? selectedRouteId === route.id : true;
        const width = isSelected ? 5 : 3;
        const opacity = isSelected ? 1 : 0.3;

        return (
          <Source key={`source-${route.id}`} id={`source-${route.id}`} type="geojson" data={geojson}>
            <Layer
              id={`layer-${route.id}`}
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': route.color || '#059669',
                'line-width': width,
                'line-opacity': opacity
              }}
            />
          </Source>
        );
      })}
    </Map>
  );
}


