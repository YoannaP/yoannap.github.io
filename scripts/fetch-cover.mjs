// Downloads a book cover from Open Library into static/books/covers/ for the Books page.
// Usage: node scripts/fetch-cover.mjs "Title" "Author"
// Then add the printed `cover:` line to the book's entry in data/books.yaml.
// Check the image before committing: Open Library sometimes returns another edition or a scanned page.
import fs from "fs";
import { execFileSync } from "child_process";

const [title, author = ""] = process.argv.slice(2);
if (!title) {
  console.error('Usage: node scripts/fetch-cover.mjs "Title" "Author"');
  process.exit(1);
}
const slug = title.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
const file = `static/books/covers/${slug}.jpg`;

const params = new URLSearchParams({ title, limit: "5", fields: "cover_i,title,author_name" });
if (author) params.set("author", author.split(/,|&/)[0].trim());
const res = await fetch("https://openlibrary.org/search.json?" + params);
const doc = (await res.json()).docs?.find(d => d.cover_i);
if (!doc) {
  console.error(`No cover found for "${title}". The page will show a plain cover in the spine's colour.`);
  process.exit(1);
}

const img = await fetch(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
fs.writeFileSync(file, Buffer.from(await img.arrayBuffer()));
try {
  // Shrink to 360px on the long side (macOS).
  execFileSync("sips", ["-Z", "360", "-s", "formatOptions", "70", file], { stdio: "ignore" });
} catch {
  console.warn("Could not resize (sips not available); keeping the full-size image.");
}
console.log(`Saved ${file} (matched "${doc.title}" by ${(doc.author_name || []).join(", ")})`);
console.log(`Add to data/books.yaml:  cover: "${slug}.jpg"`);
