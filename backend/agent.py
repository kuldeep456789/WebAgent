import time
import base64
from playwright.sync_api import sync_playwright
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentinAI")

class BrowserAgent:
    def __init__(self, external_logs=None):
        self.browser = None
        self.context = None
        self.page = None
        self.is_running = False
        self.logs = external_logs if external_logs is not None else []
        self.visited_urls = set()
        self.on_url_change = None
        self.goal = ""
        self.last_data = ""

    def log(self, action_type: str, description: str, screenshot: Optional[str] = None):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action_type": action_type,
            "description": description,
            "screenshot": screenshot
        }
        self.logs.append(entry)
        logger.info(f"[{action_type}] {description}")
        return entry

    def capture_screenshot(self):
        try:
            if not self.page: return None
            b64_str = base64.b64encode(self.page.screenshot(type='jpeg', quality=40)).decode('utf-8')
            return f"data:image/jpeg;base64,{b64_str}"
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return None

    def start_browser(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox", 
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        self.context = self.browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        self.page = self.context.new_page()
        self.log("SYSTEM", "Browser engine initialized.")

    def navigate(self, url: str):
        self.log("ACTION", f"Navigating to {url}...")
        try:
            self.page.goto(url, wait_until="domcontentloaded", timeout=45000)
            time.sleep(2)
            title = self.page.title()
            current_url = self.page.url
            
            if self.on_url_change:
                self.on_url_change(current_url)
            
            shot = self.capture_screenshot()
            self.log("OBSERVATION", f"Landed on page: {title} ({current_url})", screenshot=shot)
            
            self.visited_urls.add(current_url)
            self.extract_page_content()
            return True
        except Exception as e:
            self.log("ERROR", f"Failed to load {url}: {str(e)}")
            return False

    def extract_page_content(self):
        try:
            data = self.page.evaluate("""() => {
                const title = document.title;
                const boilerplate = ['sign in', 'accessibility', 'skip to', 'help', 'feedback', 'filters', 'tools', 'search results', 'ai overview', 'images', 'videos', 'more', 'google'];
                const lines = document.body.innerText.split('\\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 35) 
                    .filter(line => !boilerplate.some(b => line.toLowerCase().includes(b)));
                
                const cleanText = lines.slice(0, 2).join(' | '); 
                return { title, bodyText: cleanText || "" };
            }""")
            
            if not data['bodyText'] or data['bodyText'] == self.last_data:
                return data
            
            self.last_data = data['bodyText']
            current_time = datetime.now().strftime("%H:%M:%S")
            log_msg = f"TIME: {current_time} | RESULT: {data['bodyText']}"
            self.log("DATA_EXTRACTED", log_msg)
            return data
        except Exception as e:
            logger.error(f"Extraction failed: {str(e)}")
            return None

    def analyze_state(self) -> List[Dict[str, Any]]:
        elements = self.page.evaluate("""() => {
            const items = [];
            const interactive = document.querySelectorAll('button, a, input[type="text"], input[type="email"], input[type="password"], textarea, [role="button"], [role="link"]');
            
            interactive.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                let text = el.innerText || el.placeholder || el.name || el.getAttribute('aria-label') || "Unlabeled";
                
                if (isVisible && items.length < 30) { 
                    items.push({
                        index: index,
                        tagName: el.tagName.toLowerCase(),
                        text: text.substring(0, 50).trim(),
                        href: el.href || null,
                        type: el.type || null,
                        role: el.getAttribute('role') || null,
                        placeholder: el.placeholder || null
                    });
                }
            });
            return items;
        }""")
        
        return elements

    def decide_and_act(self, interactive_elements: List[Dict]):
        if not interactive_elements:
            self.log("THOUGHT", "Dead end. No interactive elements found.")
            return

        goal_lower = self.goal.lower()
        
        if "search" in goal_lower:
            search_query = self.goal.split("search")[-1].strip()
            if not search_query: search_query = "Machine Learning"
            
            inputs = [el for el in interactive_elements if el['tagName'] in ['input', 'textarea']]
            search_input = None
            for i in inputs:
                txt = (i['text'] or i['placeholder'] or "").lower()
                if any(k in txt for k in ['search', 'q', 'query', 'find']):
                    search_input = i
                    break
            
            if not search_input and inputs:
                search_input = inputs[0]
                
            if search_input:
                self.log("DECISION", f"I am going to search for '{search_query}'.")
                try:
                    self.log("ACTION", f"Typing '{search_query}' into search field.")
                    
                    target = self.page.get_by_role("combobox").first if search_input['tagName'] == 'input' else self.page.locator("input, textarea").first
                    
                    if "google" in self.page.url:
                        target = self.page.locator("textarea[name='q'], input[name='q']").first
                    
                    target.fill(search_query)
                    time.sleep(1)
                    target.press("Enter")
                    time.sleep(3)
                    
                    new_url = self.page.url
                    if self.on_url_change:
                        self.on_url_change(new_url)
                    return 
                except Exception as e:
                    self.log("ERROR", f"Search interaction failed: {e}")

        keywords = ['login', 'sign in', 'contact', 'about', 'learn more', 'results']
        best_candidate = None
        
        for el in interactive_elements:
            txt = el['text'].lower()
            if any(k in txt for k in keywords):
                best_candidate = el
                break
        
        if not best_candidate and interactive_elements:
             importance_keywords = ['main', 'content', 'link', 'article']
             for el in interactive_elements:
                txt = el['text'].lower()
                if any(k in txt for k in importance_keywords):
                    best_candidate = el
                    break

        if not best_candidate and interactive_elements:
            import random
            best_candidate = random.choice(interactive_elements)
            
        if best_candidate:
            self.log("DECISION", f"I plan to interact with '{best_candidate['text']}'.")
            
            try:
                if best_candidate['tagName'] == 'a' or best_candidate['role'] in ['link', 'button'] or best_candidate['tagName'] == 'button':
                     self.log("ACTION", f"Clicking: {best_candidate['text']}")
                     
                     if best_candidate['text'] != "Unlabeled":
                        target = self.page.get_by_text(best_candidate['text'], exact=False).first
                     else:
                        target = self.page.locator(f"{best_candidate['tagName']}").nth(best_candidate['index'])
                        
                     target.scroll_into_view_if_needed()
                     target.click(timeout=10000, force=True)
                     time.sleep(3)
                     
                     new_url = self.page.url
                     if self.on_url_change:
                         self.on_url_change(new_url)
            except Exception as e:
                self.log("ERROR", f"Interaction failed: {str(e)}")

    def stop(self):
        if self.browser:
            self.browser.close()
        if hasattr(self, 'playwright'):
            self.playwright.stop()
        self.is_running = False

    def run_mission(self, url: str, goal: str = "", steps=10):
        self.is_running = True
        self.goal = goal
        self.log("SYSTEM", f"Mission Started with Goal: {goal}")
        
        try:
            target_url = url
            if "google" in goal.lower() and "google.com" not in url:
                target_url = "https://www.google.com"
            
            self.start_browser()
            success = self.navigate(target_url)
            
            if not success:
                self.stop()
                return self.logs

            for i in range(steps):
                if not self.is_running: break
                
                elements = self.analyze_state()
                if not elements:
                    break
                    
                self.decide_and_act(elements)
                
                time.sleep(2)
                self.extract_page_content()
                shot = self.capture_screenshot()
                self.log("OBSERVATION", f"Updated View (Step {i+1})", screenshot=shot)
            
            self.log("SYSTEM", "Mission complete.")
        except Exception as e:
            self.log("ERROR", f"Mission Crashed: {str(e)}")
        finally:
            self.stop()
        
        return self.logs
