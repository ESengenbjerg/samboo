import {
  Area,
  getAreas,
  getMunicipalities,
  Municipality,
} from "@/services/places";
import { useEffect, useState } from "react";

type PlacesResult = {
  municipalities: Municipality[];
  areas: Area[];
  failed?: boolean;
};

// All municipalities and areas for the filter pickers. Fetched once per mount
export function usePlaces() {
  const [result, setResult] = useState<PlacesResult | null>(null);

  useEffect(() => {
    // Ignore the response if the component unmounted
    let cancelled = false;

    Promise.all([getMunicipalities(), getAreas()]).then(
      ([municipalitiesResult, areasResult]) => {
        if (cancelled) return;
        if (municipalitiesResult.error || areasResult.error) {
          console.log(
            "Places error:",
            municipalitiesResult.error ?? areasResult.error,
          );
          setResult({ municipalities: [], areas: [], failed: true });
          return;
        }
        setResult({
          municipalities: municipalitiesResult.data ?? [],
          areas: areasResult.data ?? [],
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    municipalities: result?.municipalities ?? [],
    areas: result?.areas ?? [],
    isLoading: !result,
    error: result?.failed ? "Kunde inte hämta kommuner. Försök igen." : null,
  };
}
