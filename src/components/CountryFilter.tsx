import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useGeoData } from '../hooks/useGeoData';

export type Region = string;

export interface CountryFilter {
  type: 'region' | 'country' | 'city';
  region?: Region;
  country?: string;
  city?: string;
}

interface CountryFilterProps {
  selectedFilters: CountryFilter[];
  onSelectionChange: (filters: CountryFilter[]) => void;
}

export function CountryFilter({
  selectedFilters,
  onSelectionChange,
}: CountryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const { regions: REGIONS, countriesByRegion: COUNTRIES_BY_REGION, countriesCities: COUNTRIES_CITIES } = useGeoData();

  const handleRegionToggle = (region: Region) => {
    const existingFilter = selectedFilters.find(
      f => f.type === 'region' && f.region === region
    );
    
    if (existingFilter) {
      onSelectionChange(selectedFilters.filter(f => !(f.type === 'region' && f.region === region)));
    } else {
      const countriesInRegion = COUNTRIES_BY_REGION[region] || [];
      const filtered = selectedFilters.filter(f => {
        if (f.type === 'region') return true;
        if (f.type === 'country' || f.type === 'city') {
          return !countriesInRegion.some(c => c.name === (f.country || ''));
        }
        return true;
      });
      onSelectionChange([...filtered, { type: 'region', region }]);
    }
  };

  const handleCountryToggle = (country: string) => {
    const existingFilter = selectedFilters.find(
      f => f.type === 'country' && f.country === country
    );
    
    if (existingFilter) {
      onSelectionChange(selectedFilters.filter(f => !(f.type === 'country' && f.country === country)));
    } else {
      const filtered = selectedFilters.filter(f => 
        !(f.type === 'city' && f.country === country)
      );
      onSelectionChange([...filtered, { type: 'country', country }]);
    }
  };

  const handleCityToggle = (country: string, city: string) => {
    const existingCityFilter = selectedFilters.find(
      f => f.type === 'city' && f.country === country && f.city === city
    );
    const countryFilter = selectedFilters.find(
      f => f.type === 'country' && f.country === country
    );
    
    if (existingCityFilter) {
      onSelectionChange(selectedFilters.filter(f => 
        !(f.type === 'city' && f.country === country && f.city === city)
      ));
    } else if (countryFilter) {
      const allCities = COUNTRIES_CITIES[country] || [];
      const otherCities = allCities.filter(c => c !== city);
      const filtered = selectedFilters.filter(f => 
        !(f.type === 'country' && f.country === country)
      );
      const newFilters = otherCities.map(c => ({ 
        type: 'city' as const, 
        country, 
        city: c 
      }));
      onSelectionChange([...filtered, ...newFilters]);
    } else {
      onSelectionChange([...selectedFilters, { type: 'city', country, city }]);
    }
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  const toggleCountryExpanded = (country: string) => {
    if (expandedCountries.includes(country)) {
      setExpandedCountries(expandedCountries.filter(c => c !== country));
    } else {
      setExpandedCountries([...expandedCountries, country]);
    }
  };

  const isRegionSelected = (region: Region) => {
    return selectedFilters.some(f => f.type === 'region' && f.region === region);
  };

  const isCountrySelected = (country: string) => {
    return selectedFilters.some(f => 
      (f.type === 'country' && f.country === country) ||
      (f.type === 'city' && f.country === country)
    );
  };

  const isCountryFullySelected = (country: string) => {
    return selectedFilters.some(f => f.type === 'country' && f.country === country);
  };

  const isCitySelected = (country: string, city: string) => {
    if (isCountryFullySelected(country)) return true;
    return selectedFilters.some(f => 
      f.type === 'city' && f.country === country && f.city === city
    );
  };

  const getTotalFilterCount = () => {
    return selectedFilters.length;
  };

  const removeFilter = (filter: CountryFilter) => {
    onSelectionChange(selectedFilters.filter(f => {
      if (f.type !== filter.type) return true;
      if (filter.type === 'region') return f.region !== filter.region;
      if (filter.type === 'country') return f.country !== filter.country;
      if (filter.type === 'city') return !(f.country === filter.country && f.city === filter.city);
      return true;
    }));
  };

  const getFilterLabel = (filter: CountryFilter) => {
    if (filter.type === 'region') return filter.region as string;
    if (filter.type === 'country') return filter.country as string;
    if (filter.type === 'city') return `${filter.country} - ${filter.city}`;
    return '';
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <span className="text-xs">
              フィルター
              {getTotalFilterCount() > 0 && ` (${getTotalFilterCount()})`}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>地域・国・都市を選択</SheetTitle>
            <SheetDescription>
              表示したい地域、国、都市を選んでください
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedFilters.length > 0 && (
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">
                  {getTotalFilterCount()}件選択中
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto p-2 text-sm"
                  type="button"
                >
                  すべてクリア
                </Button>
              </div>
            )}
            <Tabs defaultValue="region" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="region">地域</TabsTrigger>
                <TabsTrigger value="country">国・都市</TabsTrigger>
              </TabsList>
              <TabsContent value="region" className="mt-4">
                <ScrollArea className="h-[calc(85vh-280px)]">
                  <div className="space-y-2 pr-4">
                    {REGIONS.map((region) => {
                      const isSelected = isRegionSelected(region);
                      const countriesInRegion = COUNTRIES_BY_REGION[region] || [];
                      return (
                        <div key={region} className="border-b last:border-b-0 pb-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`region-${region}`}
                              checked={isSelected}
                              onCheckedChange={() => handleRegionToggle(region)}
                            />
                            <label
                              htmlFor={`region-${region}`}
                              className="leading-none cursor-pointer flex-1"
                            >
                              {region}
                              <span className="text-xs text-gray-500 ml-2">
                                ({countriesInRegion.length}カ国)
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="country" className="mt-4">
                <ScrollArea className="h-[calc(85vh-280px)]">
                  <div className="space-y-1 pr-4">
                    {REGIONS.map((region) => {
                      const countriesInRegion = COUNTRIES_BY_REGION[region] || [];
                      return (
                        <div key={region} className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 px-2">
                            {region}
                          </div>
                          {countriesInRegion.map((countryObj) => {
                            const country = countryObj.name;
                            const cities = COUNTRIES_CITIES[country] || [];
                            const isExpanded = expandedCountries.includes(country);
                            const isSelected = isCountrySelected(country);
                            const isFullySelected = isCountryFullySelected(country);
                            return (
                              <div key={country} className="border-b last:border-b-0 pb-2">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleCountryExpanded(country)}
                                    type="button"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Checkbox
                                    id={`country-${country}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleCountryToggle(country)}
                                  />
                                  <label
                                    htmlFor={`country-${country}`}
                                    className="leading-none cursor-pointer flex-1"
                                  >
                                    {country}
                                    {isFullySelected && (
                                      <span className="text-xs text-gray-500 ml-2">(全ての都市)</span>
                                    )}
                                  </label>
                                </div>
                                {isExpanded && (
                                  <div className="ml-8 mt-2 space-y-2">
                                    {cities.map((city) => (
                                      <div key={city} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`city-${country}-${city}`}
                                          checked={isCitySelected(country, city)}
                                          onCheckedChange={() => handleCityToggle(country, city)}
                                        />
                                        <label
                                          htmlFor={`city-${country}-${city}`}
                                          className="text-sm leading-none cursor-pointer flex-1"
                                        >
                                          {city}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {selectedFilters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="gap-1 h-7 text-xs">
          {getFilterLabel(filter)}
          <button
            onClick={() => removeFilter(filter)}
            className="hover:bg-gray-300 rounded-full ml-1"
            type="button"
          >
            ×
          </button>
        </Badge>
      ))}
    </div>
  );
}
