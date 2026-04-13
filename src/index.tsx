import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import {
  Section,
  DistanceUnit,
  WeightUnit,
  AreaUnit,
  VolumeUnit,
  TemperatureUnit,
  DurationUnit,
  AngleUnit,
  EnergyUnit,
  FrequencyUnit,
  PowerUnit,
  SpeedUnit,
  StorageUnit,
} from "./types";
import { parseInput } from "./utils";
import {
  normalizeUnit,
  DISTANCE_UNITS,
  WEIGHT_UNITS,
  AREA_UNITS,
  VOLUME_UNITS,
  TEMP_UNITS,
  DURATION_UNITS,
  ANGLE_UNITS,
  ENERGY_UNITS,
  FREQUENCY_UNITS,
  POWER_UNITS,
  SPEED_UNITS,
  STORAGE_UNITS,
} from "./aliases";
import { distanceResults } from "./converters/distance";
import { weightResults } from "./converters/weight";
import { areaResults } from "./converters/area";
import { volumeResults } from "./converters/volume";
import { temperatureResults } from "./converters/temperature";
import { durationResults } from "./converters/duration";
import { angleResults } from "./converters/angle";
import { energyResults } from "./converters/energy";
import { frequencyResults } from "./converters/frequency";
import { powerResults } from "./converters/power";
import { speedResults } from "./converters/speed";
import { storageResults } from "./converters/storage";
import { numberBaseResults } from "./converters/number-base";
import { dateTimeResults } from "./converters/date-time";
import { colorResults } from "./converters/color";

// ---------------------------------------------------------------------------
// Help content
// ---------------------------------------------------------------------------

const HELP_SECTIONS = [
  { category: "Distance", examples: ["5km", "100mi", "3.2ft", "10yd"] },
  { category: "Weight", examples: ["72kg", "150lb", "500g", "8oz"] },
  { category: "Area", examples: ["100m2", "5acres", "2ha", "500sqft"] },
  { category: "Volume", examples: ["2l", "1gal", "3cup", "500ml"] },
  { category: "Temperature", examples: ["100f", "0c", "300k"] },
  { category: "Duration", examples: ["90min", "2.5h", "7d", "1yr"] },
  { category: "Angle", examples: ["180deg", "3.14rad", "1turn"] },
  { category: "Energy", examples: ["500cal", "1kwh", "100btu"] },
  { category: "Frequency", examples: ["440hz", "2.4ghz", "3000rpm"] },
  { category: "Power", examples: ["100w", "5hp", "1kw"] },
  { category: "Speed", examples: ["60mph", "100kmh", "10m/s"] },
  { category: "Storage", examples: ["500mb", "1gb", "2tib", "1024kib"] },
  { category: "Number Base", examples: ["0xFF", "0b1010", "42", "255d"] },
  { category: "Date & Time", examples: ["now", "1700000000", "2024-01-15"] },
  { category: "Color", examples: ["#ff5533", "rgb(255,85,51)", "hsl(15,100,60)"] },
];

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function conversionSections(text: string): Section[] {
  const sections: Section[] = [];

  const dateTime = dateTimeResults(text);
  if (dateTime.length > 0) sections.push({ category: "Date & Time", results: dateTime });

  const bases = numberBaseResults(text);
  if (bases.length > 0) sections.push({ category: "Number Base", results: bases });

  const colors = colorResults(text);
  if (colors.length > 0) sections.push({ category: "Color", results: colors });

  const parsed = parseInput(text);
  if (parsed) {
    const { value, rawUnit } = parsed;
    const unit = normalizeUnit(rawUnit);
    if (unit !== null) {
      if (TEMP_UNITS.has(unit))
        sections.push({ category: "Temperature", results: temperatureResults(value, unit as TemperatureUnit) });
      if (DISTANCE_UNITS.has(unit))
        sections.push({ category: "Distance", results: distanceResults(value, unit as DistanceUnit) });
      if (SPEED_UNITS.has(unit)) sections.push({ category: "Speed", results: speedResults(value, unit as SpeedUnit) });
      if (WEIGHT_UNITS.has(unit))
        sections.push({ category: "Weight", results: weightResults(value, unit as WeightUnit) });
      if (DURATION_UNITS.has(unit))
        sections.push({ category: "Duration", results: durationResults(value, unit as DurationUnit) });
      if (AREA_UNITS.has(unit)) sections.push({ category: "Area", results: areaResults(value, unit as AreaUnit) });
      if (VOLUME_UNITS.has(unit))
        sections.push({ category: "Volume", results: volumeResults(value, unit as VolumeUnit) });
      if (ANGLE_UNITS.has(unit)) sections.push({ category: "Angle", results: angleResults(value, unit as AngleUnit) });
      if (ENERGY_UNITS.has(unit))
        sections.push({ category: "Energy", results: energyResults(value, unit as EnergyUnit) });
      if (FREQUENCY_UNITS.has(unit))
        sections.push({ category: "Frequency", results: frequencyResults(value, unit as FrequencyUnit) });
      if (POWER_UNITS.has(unit)) sections.push({ category: "Power", results: powerResults(value, unit as PowerUnit) });
      if (STORAGE_UNITS.has(unit))
        sections.push({ category: "Storage", results: storageResults(value, unit as StorageUnit) });
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function Command() {
  const [text, setText] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (text === "") {
      setSections([]);
      return;
    }
    setShowHelp(false);
    setSections(conversionSections(text));
  }, [text]);

  const helpAction = (
    <Action
      title={showHelp ? "Hide Help" : "Show Help"}
      shortcut={{ modifiers: ["cmd"], key: "h" }}
      onAction={() => setShowHelp((v) => !v)}
    />
  );

  if (showHelp || text === "") {
    return (
      <List onSearchTextChange={setText} searchBarPlaceholder="Convert something... (Cmd+H for help)" throttle>
        {HELP_SECTIONS.map((section) => (
          <List.Section key={section.category} title={section.category}>
            {section.examples.map((example) => (
              <List.Item key={example} title={example} actions={<ActionPanel>{helpAction}</ActionPanel>} />
            ))}
          </List.Section>
        ))}
      </List>
    );
  }

  return (
    <List onSearchTextChange={setText} searchBarPlaceholder="Convert something... (Cmd+H for help)" throttle>
      {sections.map((section) => (
        <List.Section key={section.category} title={section.category}>
          {section.results.map((result, index) => (
            <List.Item
              key={index}
              title={result.type}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy to Clipboard" content={result.value} />
                  {helpAction}
                </ActionPanel>
              }
              accessories={[{ text: result.value }]}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
