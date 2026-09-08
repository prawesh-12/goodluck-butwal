import { join } from "node:path";
import { runAll, step } from "./runner";
import { seedMedia } from "./media";
import { seedOffices } from "./offices";
import { seedSettings, seedUiStrings } from "./site-text";
import { seedPartners, seedTeam } from "./people";
import { seedServices } from "./services";

// Run from the app root, so public/ is one level down from here.
const ROOT = process.cwd();

step("media_assets", () => seedMedia(join(ROOT, "public")));
step("offices", seedOffices);
step("ui_strings", seedUiStrings);
step("settings", seedSettings);
step("team_members", seedTeam);
step("partners", seedPartners);
step("services", seedServices);

async function main() {
  console.log("Seeding from src/content into the database");
  const results = await runAll();
  const total = results.reduce((n, r) => n + r.rows, 0);
  console.log(`\nDone. ${total} rows across ${results.length} steps.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
