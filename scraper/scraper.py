#!/usr/bin/env python3
"""
TobaccoAtlas Scraper
Scrapes yanyue.cn for cigarette brand and product data.
Uses OCR to read numeric values encoded as images.
"""

import re
import time
import json
import sqlite3
import hashlib
from pathlib import Path
from io import BytesIO
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image
import pytesseract

# Configure
BASE_URL = "https://www.yanyue.cn"
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
CACHE_DIR = DATA_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "tobacco.db"
SESSION_FILE = DATA_DIR / "session.json"

# Delay between requests to be respectful
DELAY = 1.5

class YanYueScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        })
        self.db = None
        self._setup_db()

    def _setup_db(self):
        self.db = sqlite3.connect(str(DB_PATH))
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                region TEXT,
                description TEXT,
                product_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                brand_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                full_name TEXT,
                type TEXT,
                cigarette_type TEXT,
                tar TEXT,
                nicotine TEXT,
                co TEXT,
                length TEXT,
                packaging TEXT,
                primary_color TEXT,
                secondary_color TEXT,
                quantity_per_box TEXT,
                boxes_per_carton TEXT,
                price_per_box TEXT,
                price_per_carton TEXT,
                barcode_box TEXT,
                barcode_carton TEXT,
                popularity INTEGER DEFAULT 0,
                rating_taste REAL,
                rating_appearance REAL,
                rating_value REAL,
                rating_overall REAL,
                rating_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                raw_data TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        """)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                is_primary INTEGER DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        """)
        self.db.commit()

    def _get(self, url, params=None, skip_cache=False):
        """GET request with caching and delay."""
        cache_key = hashlib.md5((url + str(params)).encode()).hexdigest()[:12]
        cache_file = CACHE_DIR / f"{cache_key}.html"

        if not skip_cache and cache_file.exists():
            content = cache_file.read_text(encoding="utf-8")
            # Don't cache loading pages
            if '还剩' not in content and 'checking_browser' not in content:
                return content

        time.sleep(DELAY)
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        resp.encoding = "utf-8"

        # Don't cache loading pages
        if '还剩' not in resp.text and 'checking_browser' not in resp.text:
            cache_file.write_text(resp.text, encoding="utf-8")
        return resp.text

    def _resolve_loading_page(self, url):
        """Handle the 5-second JS loading page and get real content."""
        html = self._get(url, skip_cache=True)
        if 'window.location.href' in html or '还剩' in html:
            # Extract loading token from JS redirect
            match = re.search(r'loading=([a-z0-9]+)', html)
            if match:
                token = match.group(1)
                loading_url = f"{url}?loading={token}"
                print(f"  Following loading redirect: {token[:20]}...")
                time.sleep(DELAY)
                return self._get(loading_url)
        return html

    def _ocr_image(self, img_url):
        """Download a genpic image and OCR its value."""
        try:
            resp = self.session.get(img_url, timeout=15)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content))
            # Scale up for better OCR
            img = img.resize((img.width * 4, img.height * 4), Image.LANCZOS)
            text = pytesseract.image_to_string(
                img,
                config='--psm 7 -c tessedit_char_whitelist=0123456789.mg元/盒条支包'
            ).strip()
            # Clean up common OCR errors
            text = text.replace(' ', '').replace('\n', '')
            return text
        except Exception as e:
            print(f"    OCR error for {img_url}: {e}")
            return ""

    def get_all_brands(self):
        """Get list of all cigarette brands from the site."""
        print("Fetching brand list...")
        brands = []

        # Mainland brands (大陆)
        for region_id, region_name in [(1, "大陆"), (2, "国外"), (6, "港澳台")]:
            print(f"\nRegion: {region_name} (ID: {region_id})")
            url = f"{BASE_URL}/sort/{region_id}"
            html = self._resolve_loading_page(url)
            soup = BeautifulSoup(html, "html.parser")

            # Find brand links
            for link in soup.select('a[href*="/sort/"]'):
                href = link.get("href", "")
                if region_name == "大陆":
                    match = re.match(r'/sort/(\d+)$', href)
                else:
                    match = re.match(r'/sort/(\d+)$', href)
                if match:
                    brand_id = int(match.group(1))
                    name = link.text.strip()
                    if name and brand_id > 3 and brand_id != region_id:
                        # Check if brand has a separate page
                        if not any(b['id'] == brand_id for b in brands):
                            brands.append({
                                "id": brand_id,
                                "name": name,
                                "region": region_name
                            })

        print(f"Found {len(brands)} brands total")
        return brands

    def get_brand_products(self, brand_id, brand_name):
        """Get all product IDs for a brand."""
        products = []
        page = 1

        while True:
            url = f"{BASE_URL}/sort/{brand_id}"
            if page > 1:
                params = {"page": page}
            else:
                params = None

            html = self._resolve_loading_page(url)
            if page > 1:
                html = self._get(url, params=params)
            soup = BeautifulSoup(html, "html.parser")

            # Find product links
            found_any = False
            for link in soup.select('a[href*="/product/"]'):
                href = link.get("href", "")
                match = re.match(r'/product/(\d+)', href)
                if match:
                    pid = int(match.group(1))
                    name = link.text.strip()
                    if name and pid > 0 and len(name) > 2 and not any(
                        p['id'] == pid for p in products
                    ):
                        # Extract type and tar from the table row
                        parent_row = link.find_parent('tr') or link.find_parent('div')
                        products.append({"id": pid, "name": name})
                        found_any = True

            if not found_any:
                break

            # Check for pagination
            page_info = soup.select_one('.pagination, .page, [class*="page"]')
            if not page_info or str(page) not in str(page_info):
                # Check if there's a "next page" link
                next_link = soup.find('a', string=re.compile(r'下一页|下页|next', re.I))
                if not next_link:
                    break

            page += 1
            if page > 100:  # Safety limit
                break

        print(f"  Brand {brand_name}: {len(products)} products")
        return products

    def get_product_detail(self, product_id):
        """Get detailed product information including OCR of genpic images."""
        url = f"{BASE_URL}/product/{product_id}"
        html = self._resolve_loading_page(url)

        if '黄鹤楼(硬奇景)' not in html and 'product' not in html.lower():
            print(f"    Product {product_id}: page not accessible")
            return None

        soup = BeautifulSoup(html, "html.parser")
        data = {"id": product_id}

        # Product name
        title = soup.select_one('h3, h1, .product_title, [class*="title"]')
        if title:
            data["full_name"] = title.text.strip()

        # Breadcrumb
        breadcrumb = soup.select_one('#status, .breadcrumb, [class*="crumb"]')
        if breadcrumb:
            data["breadcrumb"] = breadcrumb.text.strip()

        # Basic info from the info list
        info_map = {}
        info_elements = soup.select('#basicinfo li, .info_title, .info_content')
        current_key = None
        for el in info_elements:
            classes = el.get("class", [])
            if "info_title" in classes:
                current_key = el.text.strip().rstrip(":").rstrip("：")
            elif "info_content" in classes and current_key:
                # Check if it's an image (genpic)
                img = el.find("img", class_="genpic")
                if img:
                    img_url = urljoin(BASE_URL, img.get("src", ""))
                    if img_url:
                        value = self._ocr_image(img_url)
                        info_map[current_key] = value
                else:
                    text = el.text.strip()
                    if text:
                        info_map[current_key] = text

        # Map Chinese labels to English keys
        field_map = {
            "品牌": "brand_name",
            "类型": "type",
            "烟支": "cigarette_type",
            "焦油": "tar",
            "烟碱": "nicotine",
            "一氧化碳": "co",
            "长度": "length",
            "包装形式": "packaging",
            "主颜色": "primary_color",
            "副颜色": "secondary_color",
            "每盒数量": "quantity_per_box",
            "条装盒数": "boxes_per_carton",
            "小盒价格": "price_per_box",
            "条装价格": "price_per_carton",
            "小盒条码": "barcode_box",
            "条装条码": "barcode_carton",
        }

        for cn_key, en_key in field_map.items():
            if cn_key in info_map:
                data[en_key] = info_map[cn_key]

        # Ratings
        rating_section = soup.select_one('[class*="score"], [class*="rating"], [class*="pingfen"]')
        if rating_section:
            rating_text = rating_section.text
            # Extract ratings like "7.5 分"
            for label, key in [("口味", "rating_taste"), ("外观", "rating_appearance"),
                               ("性价比", "rating_value"), ("综合", "rating_overall")]:
                match = re.search(rf'{label}[：:\s]*([\d.]+)', rating_text)
                if match:
                    data[key] = float(match.group(1))

        # Comments count
        comments = soup.select_one('[class*="comment"], #comment_count')
        if comments:
            count_match = re.search(r'(\d+)', comments.text)
            if count_match:
                data["comment_count"] = int(count_match.group(1))

        # Popularity
        heat_match = re.search(r'热度[：:\s]*(\d+)', html)
        if heat_match:
            data["popularity"] = int(heat_match.group(1))

        # Rating count
        rating_count_match = re.search(r'(\d+)人参与评分', html)
        if rating_count_match:
            data["rating_count"] = int(rating_count_match.group(1))

        data["raw_data"] = json.dumps(info_map, ensure_ascii=False)
        return data

    def save_brand(self, brand):
        """Save brand to database."""
        self.db.execute(
            """INSERT OR REPLACE INTO brands (id, name, region, product_count)
               VALUES (?, ?, ?, ?)""",
            (brand["id"], brand["name"], brand.get("region", ""),
             brand.get("product_count", 0))
        )
        self.db.commit()

    def save_product(self, product):
        """Save product to database."""
        if not product:
            return
        self.db.execute("""
            INSERT OR REPLACE INTO products (
                id, brand_id, name, full_name, type, cigarette_type,
                tar, nicotine, co, length, packaging, primary_color, secondary_color,
                quantity_per_box, boxes_per_carton, price_per_box, price_per_carton,
                barcode_box, barcode_carton, popularity, rating_taste, rating_appearance,
                rating_value, rating_overall, rating_count, comment_count, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            product["id"],
            product.get("brand_id", 0),
            product.get("name", product.get("full_name", "")),
            product.get("full_name", ""),
            product.get("type", ""),
            product.get("cigarette_type", ""),
            product.get("tar", ""),
            product.get("nicotine", ""),
            product.get("co", ""),
            product.get("length", ""),
            product.get("packaging", ""),
            product.get("primary_color", ""),
            product.get("secondary_color", ""),
            product.get("quantity_per_box", ""),
            product.get("boxes_per_carton", ""),
            product.get("price_per_box", ""),
            product.get("price_per_carton", ""),
            product.get("barcode_box", ""),
            product.get("barcode_carton", ""),
            product.get("popularity", 0),
            product.get("rating_taste"),
            product.get("rating_appearance"),
            product.get("rating_value"),
            product.get("rating_overall"),
            product.get("rating_count", 0),
            product.get("comment_count", 0),
            product.get("raw_data", "{}"),
        ))
        self.db.commit()

    def scrape_brands_quick(self):
        """Quick scrape: get product listings from brand pages without OCR for speed."""
        # For a quick initial scrape, just get names and IDs from brand listing pages
        # We'll do detailed scraping with OCR later for the full data

        # Known major brands with correct sort IDs
        brand_list = [
            (131, "黄鹤楼", "大陆"),
            (438, "利群", "大陆"),
            (58, "中华", "大陆"),
            (72, "云烟", "大陆"),
            (35, "黄金叶", "大陆"),
            (96, "南京", "大陆"),
            (37, "黄山", "大陆"),
            (34, "芙蓉王", "大陆"),
            (38, "玉溪", "大陆"),
            (221, "娇子", "大陆"),
            (434, "白沙", "大陆"),
            (439, "红塔山", "大陆"),
            (440, "双喜", "大陆"),
            (50, "泰山", "大陆"),
            (51, "钻石", "大陆"),
            (441, "贵烟", "大陆"),
            (57, "苏烟", "大陆"),
            (443, "七匹狼", "大陆"),
            (120, "中南海", "大陆"),
            (95, "红双喜", "大陆"),
        ]

        print(f"Starting quick scrape of {len(brand_list)} brands...")
        for brand_id, brand_name, region in brand_list:
            print(f"\nProcessing brand: {brand_name} (ID: {brand_id})")
            self.save_brand({"id": brand_id, "name": brand_name, "region": region})

            products = self.get_brand_products(brand_id, brand_name)
            self.db.execute(
                "UPDATE brands SET product_count = ? WHERE id = ?",
                (len(products), brand_id)
            )
            self.db.commit()

            for prod in products[:30]:  # Limit per brand for initial scrape
                prod["brand_id"] = brand_id
                print(f"  [{prod['id']}] {prod['name']}")

                # Get detail
                detail = self.get_product_detail(prod["id"])
                if detail:
                    detail["brand_id"] = brand_id
                    detail["name"] = prod["name"]
                    self.save_product(detail)
                    time.sleep(0.5)  # Shorter delay between product pages

            print(f"  Saved {min(len(products), 30)} products for {brand_name}")

    def export_json(self):
        """Export all data to JSON for the frontend."""
        cursor = self.db.cursor()

        # Export brands
        cursor.execute("SELECT id, name, region, description, product_count FROM brands ORDER BY name")
        brands = [dict(zip([d[0] for d in cursor.description], row)) for row in cursor.fetchall()]

        # Export products
        cursor.execute("""
            SELECT p.id, p.brand_id, b.name as brand_name, p.name, p.full_name,
                   p.type, p.cigarette_type, p.tar, p.nicotine, p.co, p.length,
                   p.packaging, p.primary_color, p.secondary_color,
                   p.quantity_per_box, p.boxes_per_carton, p.price_per_box,
                   p.price_per_carton, p.barcode_box, p.barcode_carton,
                   p.popularity, p.rating_taste, p.rating_appearance,
                   p.rating_value, p.rating_overall, p.rating_count,
                   p.comment_count
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            ORDER BY p.popularity DESC
            LIMIT 500
        """)
        products = [dict(zip([d[0] for d in cursor.description], row)) for row in cursor.fetchall()]

        data = {"brands": brands, "products": products}

        output_path = DATA_DIR / "export.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nExported {len(brands)} brands and {len(products)} products to {output_path}")
        return output_path

    def close(self):
        if self.db:
            self.db.close()


def main():
    scraper = YanYueScraper()
    try:
        scraper.scrape_brands_quick()
        scraper.export_json()
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
