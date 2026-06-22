# How the Road Damage Detection System Works
### A Simple Guide for Everyone

---

## What Is This App?

This is a website that looks at pictures of roads and tells you if the road is damaged. It can spot two types of damage:

- **Potholes** — holes or dips in the road surface
- **Cracks** — lines or fractures running through the road surface

You upload a photo of a road, the app sends it to an AI, and the AI tells you what it found. Think of it like sending a photo to a very smart engineer who never gets tired and can look at thousands of road photos instantly.

---

## How Does the AI Work? (Simple Version)

The app uses two different AI "brains":

### Brain 1 — The Spotter (YOLO)
This brain has been taught to look at a photo and **draw boxes** around every piece of damage it can find. It is like a person who circles problems on a map with a red marker. It can find multiple potholes and cracks in the same photo at once.

### Brain 2 — The Decider (CNN)
This brain looks at the whole photo and answers one question: **"Is the main problem here a pothole or a crack?"** It gives you a percentage saying how sure it is. For example: "I am 92% sure this is a pothole."

Both brains were trained by showing them thousands of road photos where humans had already labelled what the damage was. Over time, the AI learned to recognise the patterns on its own.

---

## The Pages — What Each One Does

---

### Home Page (`/`)
**What you see:** The main welcome screen of the app.

**What it does:**
- Introduces the system and explains what it is for
- Shows three live numbers at the top: how many images have been uploaded in total, how many potholes have been found, and how many cracks have been found
- These numbers update automatically from the database every time someone uses the app
- Has quick links to all the main features

**Think of it as:** The front door of the app. You land here first and can see at a glance how busy the system has been.

---

### YOLO Detection (`/test-model`)
**What you see:** A file upload box and, after uploading, an annotated image with coloured boxes drawn on the road damage.

**What it does:**
1. You choose a photo of a road from your computer
2. You click **Detect**
3. The photo is sent to the AI server
4. The AI draws coloured boxes around every pothole and crack it can find
5. The annotated photo comes back and is displayed on screen
6. Below the photo you see a table listing every detection — what it found, and how confident the AI is (shown as a percentage)

**Think of it as:** Giving a photo to an inspector who circles every problem they can see and writes a report of what they found and how sure they are.

**What the confidence score means:**
- 95% and above → the AI is very sure
- 70–94% → fairly confident
- Below 70% → the AI found something but is not totally certain

---

### CNN Classification (`/classification`)
**What you see:** A file upload box, and after uploading, a result card showing one damage type and a confidence bar.

**What it does:**
1. You upload a road photo
2. You click **Classify**
3. The AI looks at the whole image and decides: is the main problem a pothole or a crack?
4. It shows you the answer and a confidence percentage

**Think of it as:** Asking a specialist: "In one word, what is the biggest problem with this road?" The specialist gives you their answer and tells you how sure they are.

**Difference from YOLO Detection:**
- YOLO finds and locates multiple problems (draws boxes)
- CNN gives one overall verdict for the whole photo (no boxes, just a decision)

---

### Image Detection (`/upload-image`)
**What you see:** A drag-and-drop area. After detecting, you see the original photo side by side with the annotated version.

**What it does:**
1. You drag a photo into the box or click to browse for one
2. The original photo is shown as a preview
3. You click **Detect**
4. The AI processes it and returns the same photo with coloured boxes drawn on the damage
5. Both images (original and annotated) are shown next to each other so you can compare

**Think of it as:** A before-and-after view. On the left is what you sent in; on the right is what the AI marked up.

---

### Video Detection (`/upload-video`)
**What you see:** A video file uploader and a status bar showing the processing progress.

**What it does:**
1. You upload a video file of a road (for example, dashcam footage)
2. The AI breaks the video into individual frames (pictures)
3. It runs YOLO detection on each frame, drawing boxes on any damage found
4. It stitches the frames back together into a video with the boxes drawn on
5. The processed video is returned for you to download or view

**Think of it as:** Running the road inspection on every frame of a driving video, not just a single photo.

**Note:** Because videos have many frames, this takes longer than a single image. A longer video will take more time to process.

---

### Compare Models (`/compare`)
**What you see:** One upload box. After uploading, two result panels appear side by side — one for YOLO and one for CNN.

**What it does:**
1. You upload one road photo
2. The app sends it to **both** AI brains at the same time
3. On the left panel you see the YOLO result — the annotated image with boxes and a list of all detections
4. On the right panel you see the CNN result — the one-word verdict and confidence score
5. You can directly compare what each AI found from the same image

**Think of it as:** Asking two different experts to look at the same photo and giving you both their opinions at once, so you can see if they agree.

**Why is this useful?**
- If both AIs agree, you can be more confident in the result
- If they disagree, it may mean the damage is ambiguous or borderline

---

### Detection History (`/history`)
**What you see:** A table with rows of past scan results.

**What it does:**
- Every time someone uses the app to scan an image, the result is saved in a database automatically
- This page shows all of those saved results in a table
- Each row shows: a unique ID, the date and time of the scan, the filename, what damage was found, the confidence score, and whether the scan succeeded
- You can **search** by filename or ID using the search box at the top
- You can **filter** by damage type (show only potholes, or only cracks)

**Think of it as:** A logbook. Every inspection the app has ever done is recorded here so you can look back at the history.

**The status column:**
- `processed` → the scan completed successfully
- `failed` → something went wrong during the scan

---

### Analytics (`/analytics`)
**What you see:** Four number cards at the top, then three charts below.

**What it does:**
- Pulls all the data from the database and shows it as charts and statistics

**The four number cards:**
| Card | What it shows |
|---|---|
| Total Uploads | How many images have been scanned in total |
| Total Detections | How many individual damage instances have been found |
| Potholes | How many potholes have been detected across all scans |
| Cracks | How many cracks have been detected across all scans |

**The three charts:**

1. **Trend Chart (line graph):** Shows how many potholes and cracks were found each month. Goes up when more damage is being detected, and you can track whether road conditions are getting better or worse over time.

2. **Distribution Chart (pie chart):** Shows the split between potholes and cracks as a percentage. For example: "60% of damage found was potholes, 40% was cracks."

3. **Accuracy Chart (bar chart):** Shows the average confidence score of detections each month. A higher bar means the AI was more confident in its detections that month.

**Think of it as:** A monthly report that a road maintenance manager would read. Instead of looking at individual photos, it shows the big picture of how much damage has been found and where.

---

## The Journey of an Image Through the App

Here is exactly what happens when you upload a photo:

```
1. You pick a photo on your computer
      ↓
2. The photo is uploaded to the website (Vercel, hosted in the cloud)
      ↓
3. The website sends the photo to the AI server (Render, hosted in the cloud)
      ↓
4. The AI server runs the photo through the YOLO or CNN model
      ↓
5. The AI draws boxes on the photo (YOLO) or picks a damage type (CNN)
      ↓
6. The result is saved to the database (so it appears in History and Analytics)
      ↓
7. The annotated photo and detection results are sent back to the website
      ↓
8. The website displays everything on your screen
```

The whole process typically takes 1–3 seconds for a single image.

---

## What the Coloured Boxes Mean (YOLO Results)

When YOLO draws boxes on your image:

- Each box surrounds one piece of road damage
- The label above the box shows what type it is (`pothole` or `crack`)
- The percentage next to the label shows how confident the AI is
- Multiple boxes can appear on the same image if multiple problems are found

Example: A box labelled `pothole 94%` means the AI found a pothole there and is 94% sure about it.

---

## Common Questions

**Q: What types of images can I upload?**
A: JPEG, PNG, WebP, BMP, and TIFF. Maximum file size is 10MB. Standard phone camera photos (JPEG) work perfectly.

**Q: Can it detect damage in dark or blurry photos?**
A: The AI works best with clear, well-lit photos. Blurry or very dark images will produce lower confidence scores or may miss damage.

**Q: Why does it sometimes take a long time to respond?**
A: The AI server goes to "sleep" after 15 minutes of no activity to save costs (it is hosted on a free server). When you send the first request after a period of inactivity, the server needs 30–60 seconds to wake up. After that first request, it responds quickly.

**Q: Can I upload a video from a car driving down a road?**
A: Yes. Use the **Video Detection** page. The longer the video, the longer it takes to process.

**Q: Does the app store my photos?**
A: The app stores the **results** of scans (damage type, confidence, filename) in a database. The actual image files are not permanently stored — they are processed and discarded.

**Q: What is the difference between YOLO and CNN?**
A: YOLO finds and locates every individual piece of damage in a photo (draws boxes). CNN looks at the whole photo and gives one overall answer about the main type of damage. Use YOLO when you want to know exactly where the damage is. Use CNN when you want a quick overall verdict.
