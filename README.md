[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
![Updated for - Scarlet/Violet](https://img.shields.io/static/v1?label=Updated+for&message=Scarlet%2FViolet&color=1384c4)

# Nuzlocke & SoulLink Tracker

A browser-based tool for tracking Pokémon encounters during **Nuzlocke** and **SoulLink** challenge runs. No account or installation required — everything is saved locally in your browser.

[**Try it online →**](https://twocrow.github.io/nuzlocke-tracker-soullink/)

---

## Features

- **Nuzlocke mode** — track a single encounter and nickname per location, plus a catch status.
- **SoulLink mode** — track two linked encounters side-by-side (one per player), with individual nicknames and a shared status per location.
- **Player names** — in SoulLink mode you can name both players; the column headers update to show e.g. *Jeff's Encounter* and *Lena's Encounter*.
- **All Pokémon available** — every species from Generations 1–9 can be selected regardless of which game you're tracking.
- **Custom locations** — add your own locations between any two existing ones using the per-row **+** button, with a choice to insert Before or After the clicked row.
- **Persistent storage** — all data is kept in your browser's `localStorage`; nothing is sent to a server.
- **Import / Export** — save your run as a `.json` file and reload it at any time, on any device.
- **Reset options** — clear just the encounter data, or do a full reset that also removes custom locations.
- **Dark theme** — toggle in the top-right corner.
- **16 games supported** — Red/Blue/Yellow through Scarlet/Violet, plus a blank Custom game slot.

---

## Getting Started

Open the page in your browser. The tracker starts on the Red/Blue/Yellow tab in Nuzlocke mode.

### Choosing a game

Click the **Games** dropdown at the top-left and select the game you are playing. Each game has its own independent set of data.

### Switching between Nuzlocke and SoulLink mode

1. Click the **⚙ gear icon** next to the game title to open Game Settings.
2. Under **Mode**, select either **Nuzlocke** or **SoulLink**.
   - Nuzlocke shows one Encounter and one Nickname column per row.
   - SoulLink shows two Encounter and two Nickname columns per row.
3. In SoulLink mode, fill in **Player A Name** and **Player B Name** (optional). Once set, the column headers update to show each player's name (e.g. *Jeff's Encounter*).

### Recording an encounter

- Click the **Encounter** dropdown in a row and start typing a Pokémon's name to search. Select it to confirm.
- Type a nickname in the **Nickname** field (optional).
- In SoulLink mode, fill in both the A and B columns for the two linked catches.
- Set the **Status** dropdown to reflect what happened to the Pokémon:

| Status | Meaning |
|--------|---------|
| Captured | Successfully caught and in the party or box |
| Received | Obtained as a gift (starter, fossil, etc.) |
| Traded | Received via in-game trade |
| Missed | Fainted or ran before being caught |
| Stored | Deliberately kept in a box |
| Deceased | Fainted and considered dead under Nuzlocke rules |

### Adding a custom location

Some games have optional areas, sidequests, or gift encounters not covered by the default list. To add one:

1. Click the **+** button on any row.
2. Enter a name for the new location.
3. Choose **Before** or **After** to control where it appears relative to the row you clicked.
4. Click **Add**.

To remove or clear a custom location, click its **✕** delete button. You will be asked whether to clear its data only, or remove the location entirely.

### Exporting your run

Click **Export** in the top bar. A `.json` file is downloaded named `<game>.<date>.json`.

The file stores:
- All encounter, nickname, and status data for every location.
- Any custom locations you added.
- The mode (Nuzlocke or SoulLink) and player names (if set).

### Importing a saved run

Click **Import**, select a previously exported `.json` file, and confirm. Any existing data for that game will be replaced. The mode and player names stored in the file are also restored.

### Resetting a game

Click **Reset** in the top bar:

- **Clear values** — wipes all encounter, nickname, and status data while keeping your custom locations.
- **Total reset** — clears everything including custom locations, restoring the game to its default state.

---

## Supported Games

| Tab | Game(s) |
|-----|---------|
| RBY | Red / Blue / Yellow |
| GSC | Gold / Silver / Crystal |
| RSE | Ruby / Sapphire / Emerald |
| FRLG | FireRed / LeafGreen |
| DPPt | Diamond / Pearl / Platinum |
| HGSS | HeartGold / SoulSilver |
| BW | Black / White |
| BW2 | Black 2 / White 2 |
| XY | X / Y |
| ORAS | Omega Ruby / Alpha Sapphire |
| SM | Sun / Moon |
| USUM | Ultra Sun / Ultra Moon |
| SwSh | Sword / Shield |
| SV | Scarlet / Violet |
| Custom | Blank slate — add your own locations |

---

## Running Locally

No build step is required to run the tracker from a local file. Simply open `index.html` in any modern browser.

If you want to rebuild the minified production bundle (optional):

```bash
npm install
npm run build
```

---

## Credits

- Original nuzlocke tracker by [Ashenfactory](https://github.com/Ashenfactory/nuzlocke-tracker)
- Pokémon sprites for Generations 1–8 from [msikma's pokesprite project](https://github.com/msikma/pokesprite)
- Generation 9 sprites created by [Ezerart](https://twitter.com/EzerArt_)
- Pokémon © Pokémon / Nintendo / Creatures Inc. / GAME FREAK inc.

---

## License

[MIT](LICENSE.txt)
