import moment from "moment";
import { Detail } from "../types";

export function dateTimeResults(text: string): Detail[] {
  const results: Detail[] = [];

  function addDate(date: moment.Moment, isNow: boolean) {
    results.push({ value: date.utc().toISOString(), type: "Date UTC" });
    results.push({ value: date.local().toISOString(true), type: "Date" });
    results.push({ value: date.unix() + "", type: "Epoch" });
    results.push({ value: date.valueOf() + "", type: "Epoch Millis" });
    if (!isNow) {
      results.push({ value: date.fromNow(), type: "Difference" });
      const difference = moment.duration(date.diff(moment()));
      results.push({ value: difference.asMilliseconds() + "", type: "Difference Milliseconds" });
      results.push({ value: Math.round(difference.asSeconds()) + "", type: "Difference Seconds" });
      results.push({ value: Math.round(difference.asMinutes()) + "", type: "Difference Minutes" });
      results.push({ value: Math.round(difference.asHours()) + "", type: "Difference Hours" });
      results.push({ value: Math.round(difference.asDays()) + "", type: "Difference Days" });
      results.push({ value: Math.round(difference.asMonths()) + "", type: "Difference Months" });
      results.push({ value: Math.round(difference.asYears()) + "", type: "Difference Years" });
    }
  }

  if (/^\d{10}$/.test(text)) {
    addDate(moment(Number(text) * 1000), false);
  }
  if (/^\d{13}$/.test(text)) {
    addDate(moment(Number(text)), false);
  }
  if (text.toLocaleLowerCase() === "now") {
    addDate(moment(), true);
  }
  // Only parse as a date string if it contains non-numeric characters (e.g. hyphens,
  // slashes, colons, spaces) so bare integers like 10/100/1000 are never treated as dates.
  if (/[^\d]/.test(text)) {
    const other = moment(text, moment.ISO_8601, false);
    if (other.isValid()) addDate(other, false);
  }

  return results;
}
