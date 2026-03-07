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
import { numberBaseResults } from "./converters/number-base";
import { dateTimeResults } from "./converters/date-time";

function conversionSections(text: string): Section[] {
  const sections: Section[] = [];

  const dateTime = dateTimeResults(text);
  if (dateTime.length > 0) sections.push({ category: "Date & Time", results: dateTime });

  const bases = numberBaseResults(text);
  if (bases.length > 0) sections.push({ category: "Number Base", results: bases });

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
    }
  }

  return sections;
}

export default function Command() {
  const [text, setText] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (text === "") {
      setSections([]);
      return;
    }
    setSections(conversionSections(text));
  }, [text]);

  return (
    <List onSearchTextChange={setText} searchBarPlaceholder="Convert something... (e.g. 5km, 100f, 72kg)" throttle>
      {sections.map((section) => (
        <List.Section key={section.category} title={section.category}>
          {section.results.map((result, index) => (
            <List.Item
              key={index}
              title={result.type}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy to Clipboard" content={result.value} />
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
