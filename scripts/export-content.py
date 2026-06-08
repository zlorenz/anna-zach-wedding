#!/usr/bin/env python3
"""Export page content from rendered MAMP HTML into src/data/*.json"""

import json
import re
import html as html_lib
import urllib.request
from pathlib import Path

BASE = "http://localhost:8888/annaandzach"
OUT = Path(__file__).resolve().parent.parent / "src" / "data"
SLUGS = {
    "home": "",
    "itinerary": "itinerary",
    "travel": "travel",
    "accommodation": "accomodation",
    "faq": "faq",
    "things-to-do": "things-to-do",
    "rsvp": "rsvp",
}


def fetch(slug: str) -> str:
    path = f"/index.php/{slug}/" if slug else "/"
    with urllib.request.urlopen(BASE + path, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def main_inner(html: str) -> str:
    m = re.search(r'<main[^>]*id="main"[^>]*>(.*?)</main>', html, re.S | re.I)
    return m.group(1) if m else ""


def strip_scripts(s: str) -> str:
    return re.sub(r"<script[^>]*>.*?</script>", "", s, flags=re.S | re.I)


def text_content(s: str) -> str:
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html_lib.unescape(s)
    return re.sub(r"\n{3,}", "\n\n", s).strip()


def parse_nav(html: str) -> list:
    items = []
    for href, title in re.findall(
        r'class="nav-link"[^>]*href="[^"]*/([^/"]+)/"[^>]*>([^<]+)</a>', html
    ):
        if href and title.strip():
            items.append({"href": f"/{href}/", "label": title.strip()})
    return items


def extract_paragraphs_from_html(html: str) -> list:
    paragraphs = []
    for m in re.finditer(r"<p[^>]*>(.*?)</p>", html, re.S | re.I):
        text = text_content(m.group(1))
        if text:
            paragraphs.append(text)
    return paragraphs


def parse_home(main: str) -> tuple:
    story_m = re.search(
        r'class="entry-content az-entry-content"[^>]*>(.*?)</motion:div>|class="entry-content az-entry-content"[^>]*>(.*?)</motion:motion:div>|class="entry-content az-entry-content"[^>]*>(.*?)</div>\s*</motion:div>',
        main,
        re.S,
    )
    story_html = ""
    if story_m:
        story_html = next(g for g in story_m.groups() if g) if story_m.groups() else ""
    if not story_html:
        story_m = re.search(
            r'class="entry-content az-entry-content"[^>]*>(.*?)</div>\s*</div>\s*</motion:div>',
            main,
            re.S,
        )
        if story_m:
            story_html = story_m.group(1)
    if not story_html:
        story_m = re.search(
            r'<section class="az-section">.*?class="entry-content az-entry-content"[^>]*>(.*?)</motion:div>',
            main,
            re.S,
        )
        if story_m:
            story_html = story_m.group(1)
    # simpler: between Our Story section
    story_m = re.search(
        r'<div class="entry-content az-entry-content">\s*(.*?)\s*</div>\s*</div>\s*</div>\s*</section>',
        main,
        re.S,
    )
    if story_m:
        story_html = story_m.group(1)
    story_html = strip_scripts(story_html).strip()
    return (
        {
            "eventDate": "December 5, 2026",
            "eventLocation": "Nha Trang, Vietnam",
        },
        extract_paragraphs_from_html(story_html),
    )


def parse_itinerary(main: str) -> dict:
    intro_m = re.search(
        r'az-itinerary-page__intro.*?class="az-entry-content"[^>]*>(.*?)</div>',
        main,
        re.S,
    )
    intro_html = intro_m.group(1).strip() if intro_m else ""

    wedding = []
    for block in re.findall(
        r'<article[^>]*class="([^"]*az-itinerary-event--timeline[^"]*)"[^>]*>(.*?)</article>',
        main,
        re.S,
    ):
        classes, body = block
        time_m = re.search(
            r'class="az-itinerary-event__time"[^>]*>\s*([^<]+)', body
        )
        title_m = re.search(
            r'class="az-itinerary-event__title"[^>]*>([^<]+)', body
        )
        desc_m = re.search(
            r'class="az-itinerary-event__description"[^>]*>(.*?)</motion:motion:motion:div>|class="az-itinerary-event__description"[^>]*>(.*?)</div>',
            body,
            re.S,
        )
        loc_m = re.search(
            r'class="az-itinerary-event__location"[^>]*>([^<]+)', body
        )
        note_m = re.search(r'class="az-itinerary-event__note"[^>]*>([^<]+)', body)
        desc = ""
        if desc_m:
            desc = next((g for g in desc_m.groups() if g), "") or ""
        desc = strip_scripts(desc).strip()
        note_text = note_m.group(1).strip() if note_m else ""
        if note_text:
            if desc:
                desc = re.sub(r"</p>\s*$", f" {note_text}</p>", desc, count=1) if "</p>" in desc else f"{desc} {note_text}"
            else:
                desc = f"<p>{note_text}</p>"
        wedding.append(
            {
                "time": time_m.group(1).strip() if time_m else "",
                "title": title_m.group(1).strip() if title_m else "",
                "descriptionHtml": desc,
                "location": loc_m.group(1).strip() if loc_m else "",
                "featured": "az-itinerary-event--featured" in classes,
                "typeClass": re.search(r"az-itinerary-event--type-([a-z0-9-]+)", classes or "") and re.search(r"az-itinerary-event--type-([a-z0-9-]+)", classes).group(1) or "",
            }
        )

    multi_days = []
    for day_block in re.findall(
        r'<section[^>]*class="az-itinerary-day[^"]*"[^>]*>(.*?)</section>',
        main,
        re.S,
    ):
        title_m = re.search(r'class="az-itinerary-day__title"[^>]*>([^<]+)', day_block)
        date_m = re.search(r'class="az-itinerary-day__date"[^>]*>([^<]+)', day_block)
        desc_m = re.search(
            r'class="az-itinerary-day__description"[^>]*>(.*?)</div>', day_block, re.S
        )
        events = []
        for ev in re.findall(
            r'<article[^>]*class="([^"]*az-itinerary-event--multi[^"]*)"[^>]*>(.*?)</article>',
            day_block,
            re.S,
        ):
            classes, body = ev
            time_m = re.search(
                r'class="az-itinerary-event__time"[^>]*>\s*([^<]+)', body
            )
            title_m = re.search(
                r'class="az-itinerary-event__title"[^>]*>([^<]+)', body
            )
            desc_m = re.search(
                r'class="az-itinerary-event__description"[^>]*>(.*?)</motion:div>|class="az-itinerary-event__description"[^>]*>(.*?)</motion:div>',
                body,
                re.S,
            )
            link_m = re.search(
                r'class="az-itinerary-event__external-link"[^>]*href="([^"]+)"[^>]*>([^<]+)',
                body,
            )
            desc = ""
            if desc_m:
                desc = next((g for g in desc_m.groups() if g), "") or ""
            events.append(
                {
                    "time": time_m.group(1).strip() if time_m else "",
                    "title": title_m.group(1).strip() if title_m else "",
                    "descriptionHtml": strip_scripts(desc).strip(),
                    "externalUrl": link_m.group(1) if link_m else "",
                    "externalLabel": link_m.group(2).strip() if link_m else "",
                    "typeClass": re.search(r"az-itinerary-event--type-([a-z0-9-]+)", classes or "") and re.search(r"az-itinerary-event--type-([a-z0-9-]+)", classes).group(1) or "",
                }
            )
        if title_m or events:
            multi_days.append(
                {
                    "label": title_m.group(1).strip() if title_m else "",
                    "date": date_m.group(1).strip() if date_m else "",
                    "descriptionHtml": strip_scripts(desc_m.group(1)).strip() if desc_m else "",
                    "highlight": "az-itinerary-day--highlight" in day_block,
                    "events": events,
                }
            )

    return {
        "introHtml": strip_scripts(intro_html),
        "weddingDay": wedding,
        "multiDay": multi_days,
    }


def yaml_scalar(value: str) -> str:
    """Quote a string for YAML when needed; keeps Unicode as-is."""
    if not value:
        return '""'
    if "\n" in value or ":" in value or value[0] in "#'\"@" or value.strip() != value:
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return value


def write_home_welcome_yaml(paragraphs: list, path: Path) -> None:
    lines = [
        "# Home page welcome message — one paragraph per list item.",
        "# Edit with normal punctuation (', —, etc.).",
        "",
        "paragraphs:",
    ]
    for paragraph in paragraphs:
        lines.append("  - |")
        for line in paragraph.splitlines() or [""]:
            lines.append(f"    {line}")
        lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_faq_yaml(data: dict, path: Path) -> None:
    lines = [
        "# FAQ page copy — edit with normal punctuation. tooltipColor: pink_soft | blue_mist",
        "",
        f"title: {yaml_scalar(data.get('title', 'Frequently Asked Questions'))}",
        "",
        "questions:",
    ]
    for row in data.get("questions", []):
        lines.append(f"  - question: {yaml_scalar(row['question'])}")
        answer = row.get("answer", "")
        if "\n" in answer:
            lines.append("    answer: |")
            for line in answer.splitlines():
                lines.append(f"      {line}")
        else:
            lines.append(f"    answer: {yaml_scalar(answer)}")
        lines.append(f"    tooltipColor: {row.get('tooltipColor', 'pink_soft')}")
        lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_itinerary_yaml(data: dict, path: Path) -> None:
    lines = [
        "# Itinerary page — edit with normal punctuation. typeClass: ceremony | reception | cocktails | photos | party | travel | other",
        "",
        f"introHtml: {yaml_scalar(data.get('introHtml', ''))}",
        "",
        "weddingDay:",
    ]
    for event in data.get("weddingDay", []):
        lines.append(f"  - time: {yaml_scalar(event.get('time', ''))}")
        lines.append(f"    title: {yaml_scalar(event.get('title', ''))}")
        lines.append(f"    descriptionHtml: {yaml_scalar(event.get('descriptionHtml', ''))}")
        lines.append(f"    location: {yaml_scalar(event.get('location', ''))}")
        lines.append(f"    featured: {'true' if event.get('featured') else 'false'}")
        lines.append(f"    typeClass: {event.get('typeClass', 'other')}")
        lines.append("")

    lines.append("multiDay:")
    for day in data.get("multiDay", []):
        lines.append(f"  - label: {yaml_scalar(day.get('label', ''))}")
        lines.append(f"    date: {yaml_scalar(day.get('date', ''))}")
        lines.append(f"    descriptionHtml: {yaml_scalar(day.get('descriptionHtml', ''))}")
        lines.append(f"    highlight: {'true' if day.get('highlight') else 'false'}")
        lines.append("    events:")
        for event in day.get("events", []):
            lines.append(f"      - time: {yaml_scalar(event.get('time', ''))}")
            lines.append(f"        title: {yaml_scalar(event.get('title', ''))}")
            lines.append(f"        descriptionHtml: {yaml_scalar(event.get('descriptionHtml', ''))}")
            lines.append(f"        externalUrl: {yaml_scalar(event.get('externalUrl', ''))}")
            lines.append(f"        externalLabel: {yaml_scalar(event.get('externalLabel', ''))}")
            lines.append(f"        typeClass: {event.get('typeClass', 'other')}")
            lines.append("")
        lines.append("")

    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_faq(main: str) -> dict:
    title_m = re.search(r'class="az-faq__title"[^>]*>([^<]+)', main)
    rows = []
    for item in re.findall(
        r'class="az-faq__item"[^>]*data-tooltip-color="([^"]+)"[^>]*>.*?class="az-faq__question-text"[^>]*>([^<]+).*?class="az-faq__answer"[^>]*>(.*?)</div>\s*</motion:div>',
        main,
        re.S,
    ):
        color, q, a = item
        rows.append(
            {
                "question": html_lib.unescape(q.strip()),
                "answer": text_content(a),
                "tooltipColor": color,
            }
        )
    if not rows:
        for item in re.findall(
            r'data-tooltip-color="([^"]+)".*?az-faq__question-text"[^>]*>([^<]+).*?az-faq__answer"[^>]*>(.*?)</div>',
            main,
            re.S,
        ):
            color, q, a = item
            rows.append(
                {
                    "question": html_lib.unescape(q.strip()),
                    "answer": text_content(a),
                    "tooltipColor": color,
                }
            )
    return {
        "title": title_m.group(1).strip() if title_m else "You got questions? We got answers.",
        "questions": rows,
    }


def parse_json_var(html: str, name: str):
    m = re.search(rf"var {name} = (\{{.*?\}});", html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def parse_travel(html: str, main: str) -> dict:
    return {
        "mapConfig": parse_json_var(html, "azTravelMap"),
        "mainHtml": strip_scripts(main),
    }


def parse_accommodation(html: str, main: str) -> dict:
    return {
        "mapConfig": parse_json_var(html, "azAccommodationMap"),
        "mainHtml": strip_scripts(main),
    }


def parse_simple_content(main: str) -> dict:
    content_m = re.search(
        r'class="entry-content az-entry-content"[^>]*>(.*?)</div>\s*</div>\s*</div>\s*</section>',
        main,
        re.S,
    )
    return {
        "contentHtml": strip_scripts(content_m.group(1)).strip() if content_m else "",
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pages = {}
    nav = []

    for key, slug in SLUGS.items():
        print(f"Fetching {key}...")
        html = fetch(slug)
        if not nav:
            nav = parse_nav(html)
        main = strip_scripts(main_inner(html))

        if key == "home":
            home_json, home_welcome = parse_home(main)
            pages[key] = home_json
            write_home_welcome_yaml(home_welcome, OUT / "home-welcome.yaml")
            print("  wrote home-welcome.yaml")
        elif key == "itinerary":
            itinerary_data = parse_itinerary(main)
            write_itinerary_yaml(itinerary_data, OUT / "itinerary.yaml")
            print("  wrote itinerary.yaml")
            pages[key] = itinerary_data
        elif key == "travel":
            pages[key] = parse_travel(html, main)
        elif key == "accommodation":
            pages[key] = parse_accommodation(html, main)
        elif key == "faq":
            pages[key] = parse_faq(main)
        else:
            pages[key] = parse_simple_content(main)

    site = {
        "name": "Anna & Zach",
        "copyrightYear": 2026,
        "nav": nav,
        "brandNavDark": "/assets/brand/initials-symbol-dark.png",
        "brandNavLight": "/assets/brand/initials-symbol-light.png",
        "brandHeroWordmark": "/assets/brand/anna-zach-symbol-light.png",
    }
    (OUT / "site.json").write_text(json.dumps(site, indent=2), encoding="utf-8")
    for key, data in pages.items():
        if key == "faq":
            write_faq_yaml(data, OUT / "faq.yaml")
            print("  wrote faq.yaml")
        elif key == "itinerary":
            pass  # already wrote itinerary.yaml
        else:
            (OUT / f"{key}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"  wrote {key}.json")

    print("Done.")


if __name__ == "__main__":
    main()
