import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import moment from "moment";

interface Detail {
  value: string,
  type: string,
}

export default function Command() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Detail[]>([])

  useEffect(() => {
    let results: Detail[] = []
    if (text != "") {
      let time = timeResults(text);
      results = results.concat(time);
    }
    setResults(results)
  }, [text])

  return (
    <List
      onSearchTextChange={setText}
      searchBarPlaceholder="Convert something..."
      throttle
    >
      {
        results.map((result, index) => (
          <List.Item
            key={index}
            title={result.type}
            actions={<ActionPanel title="#1 in raycast/extensions"><Action.CopyToClipboard title="Copy To Clipboard" content={result.value} /></ActionPanel>}
            accessories={[{ text: result.value }]}
          />
        ))
      }
    </List>
  );
}

function timeResults(text: string): Detail[] {
  let results: Detail[] = []

  function addDate(date: moment.Moment, isNow: boolean) {
    results.push({ value: date.utc().toISOString(), type: "Date UTC" })
    results.push({ value: date.local().toISOString(true), type: `Date` })
    results.push({ value: date.unix() + "", type: "Epoch" })
    results.push({ value: date.valueOf() + "", type: "Epoch Millis" })
    if (!isNow) {
      results.push({ value: date.fromNow(), type: "Difference" })
      let difference = moment.duration(date.diff(moment()))
      results.push({ value: difference.asMilliseconds() + "", type: "Difference Milliseconds" })
      results.push({ value: Math.round(difference.asSeconds()) + "", type: "Difference Seconds" })
      results.push({ value: Math.round(difference.asMinutes()) + "", type: "Difference Minutes" })
      results.push({ value: Math.round(difference.asHours()) + "", type: "Difference Hours" })
      results.push({ value: Math.round(difference.asDays()) + "", type: "Difference Days" })
      results.push({ value: Math.round(difference.asMonths()) + "", type: "Difference Months" })
      results.push({ value: Math.round(difference.asYears()) + "", type: "Difference Years" })
    }
  }

  if (text.length === 10) {
    let epoch = Number(text + "000")
    if (!isNaN(epoch)) {
      addDate(moment(epoch), false);
    }
  }
  if (text.length === 13) {
    let epoch = Number(text)
    if (!isNaN(epoch)) {
      addDate(moment(epoch), false);
    }
  }
  if (text.toLocaleLowerCase() === "now") {
    addDate(moment(), true);
  }
  let other = moment(text)
  if (other.isValid()) {
    addDate(other, false);
  }

  return results;
}
