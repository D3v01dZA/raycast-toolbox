# Toolbox

A Raycast extension for quick unit conversions and number base encoding. Type anything into the search bar and results appear instantly, grouped by category.

## Usage

Open the **Convert** command and start typing. The extension guesses what you mean from the number and unit you enter.

```
5 km
100 fahrenheit
72 kg
0xff
180 degrees
1.5 kWh
```

Press **Enter** on any result to copy it to the clipboard.

## Supported Conversions

### Distance

`km` · `m` · `cm` · `mm` · `miles` · `ft` · `in` · `yd`

### Weight

`kg` · `g` · `mg` · `lb` · `oz` · `tonnes`

### Area

`m2` · `km2` · `cm2` · `ft2` · `in2` · `acres` · `ha`

> Also accepts: `sqft`, `square meters`, `feet squared`, `square m`, etc.

### Volume

`L` · `mL` · `gal` · `qt` · `pt` · `fl oz` · `cup`

### Temperature

`celsius` · `fahrenheit` · `kelvin`

> Also accepts: `degrees fahrenheit`, `degrees c`, `100f`, `37C`, etc.

### Speed

`m/s` · `km/h` · `mph` · `knots` · `ft/s`

### Duration

`ms` · `s` · `min` · `h` · `d` · `weeks` · `months` · `years`

### Angle

`degrees` · `radians` · `gradians` · `turns`

### Energy

`J` · `kJ` · `cal` · `kcal` · `Wh` · `kWh` · `eV` · `BTU`

### Frequency

`Hz` · `kHz` · `MHz` · `GHz` · `rpm`

### Power

`W` · `kW` · `MW` · `hp` · `BTU/hr`

### Number Base

Converts integers between decimal, binary, octal, and hexadecimal.

| Input                       | Detected as        |
| --------------------------- | ------------------ |
| `255`                       | Decimal            |
| `0xff` or `ffh`             | Hexadecimal        |
| `0b11111111` or `11111111b` | Binary             |
| `0o377` or `377o`           | Octal              |
| `255d`                      | Decimal (explicit) |

### Date & Time

Converts timestamps and date strings to various formats.

| Input           | Detected as                                    |
| --------------- | ---------------------------------------------- |
| `1712188800`    | Unix epoch (seconds)                           |
| `1712188800000` | Unix epoch (milliseconds)                      |
| `now`           | Current time                                   |
| `2024-04-04`    | Date string (any format moment.js understands) |

Outputs: UTC ISO, local ISO, epoch, epoch millis, and human-relative difference.

## Input Flexibility

- **Case-insensitive** — `KM`, `km`, `Km` all work
- **Full words** — `kilometers`, `pounds`, `degrees fahrenheit`, `fluid ounces`
- **Abbreviations** — `km`, `lb`, `kWh`, `rpm`
- **Ambiguous units show all matches** — `5m` shows both Distance and Duration results
