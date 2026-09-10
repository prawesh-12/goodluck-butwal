import { join } from "node:path";
import { runAll, step } from "./runner";
import { seedMedia } from "./media";
import { seedOffices } from "./offices";
import { seedSettings, seedUiStrings } from "./site-text";
import { seedPartners, seedTeam } from "./people";
import { seedServices } from "./services";
import { seedDestinations, seedFaqs } from "./destinations";
import { seedAltText } from "./alt-text";
import { seedPages } from "./pages";
import { seedPostCategories, seedPosts, seedRating } from "./editorial";
import { seedEvents } from "./events";
import { seedTestPrep } from "./test-prep";
import { seedCourseCategories, seedPlaceholderCatalogue } from "./catalogue";

// Run from the app root, so public/ is one level down from here.
const ROOT = process.cwd();

step("media_assets", () => seedMedia(join(ROOT, "public")));
step("offices", seedOffices);
step("ui_strings", seedUiStrings);
step("settings", seedSettings);
step("team_members", seedTeam);
step("partners", seedPartners);
step("services", seedServices);
step("destinations", seedDestinations);
step("faqs", seedFaqs);
step("course_categories", seedCourseCategories);
// Placeholder institutions and courses, only under --dev.
step("catalogue", seedPlaceholderCatalogue);
step("post_categories", seedPostCategories);
step("posts", seedPosts);
step("events", seedEvents);
step("rating", seedRating);
step("test_prep", seedTestPrep);
step("pages", seedPages);
step("alt_text", seedAltText);

async function main() {
  console.log("Seeding from db/seed/source into the database");
  const results = await runAll();
  const total = results.reduce((n, r) => n + r.rows, 0);
  console.log(`\nDone. ${total} rows across ${results.length} steps.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
