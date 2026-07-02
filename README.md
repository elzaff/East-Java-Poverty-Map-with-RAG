<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <br />
  <img src="https://img.shields.io/badge/PyTorch-%23EE4C2C.svg?style=for-the-badge&logo=PyTorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/Hugging%20Face-FFD21E.svg?style=for-the-badge&logo=huggingface&logoColor=000" alt="Hugging Face" />
  <img src="https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=OpenAI&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  
  <br />
  <br />

  <h1>🌍 East Java Poverty Map (Peta Kemiskinan Jatim)</h1>
  <p>
    <strong>Interactive dashboard and poverty risk estimator powered by Deep Learning, NLP, and RAG.</strong>
  </p>
  
  <p>
    <a href="https://poverty-map-web.vercel.app"><strong>View Live Demo »</strong></a>
  </p>
</div>

<br />

## 🌟 Overview

**East Java Poverty Map** is a modern, interactive web dashboard designed to visualize, predict, and explain poverty rates across East Java, Indonesia. By combining spatial remote sensing data with local news articles, this platform provides both quantitative poverty predictions and qualitative explanations down to the *Kecamatan* (sub-district) and *Kabupaten* (district) levels.

### 🚀 Live Application

**🔗 [https://poverty-map-web.vercel.app](https://poverty-map-web.vercel.app)**

## ✨ Key Features

* 🗺️ **Interactive Geo-Spatial Map:** Explore poverty risk scores across East Java using a highly responsive, color-coded map powered by MapLibre GL.
* 📊 **Deep Learning Predictions:** See historical data (2018-2024) and future poverty rate estimations (2025-2026) generated via sophisticated Deep Learning models (incorporating spatial indices like NDVI, NDBI, NTL, etc.).
* 🤖 **RAG & NLP Integration:** Displays localized AI-generated narratives and event scores (Economy, Infrastructure, Employment) using Retrieval-Augmented Generation (RAG) based on local news data to explain *why* poverty is changing in a specific region.
* 🔍 **Explainable AI (XAI):** Integrated SHAP (SHapley Additive exPlanations) values visualization to transparently show which features (e.g., Night Time Lights, Vegetation) contribute most to the poverty predictions.
* 🏢 **Dual-Level Granularity:** Seamlessly toggle between granular *Kecamatan* view and aggregated *Kabupaten* view to analyze data at your preferred administrative level.
* **Scenario Run Switching:** Compare Aggregate Weak Supervision runs with Direct District benchmark runs across model architectures, feature scenarios, and aggregation weights.
* 📈 **Dynamic Timeseries Slider:** Play, pause, or slide through different years to see how poverty distribution evolves over time.

## 🛠️ Tech Stack

**Frontend Architecture:**

* **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

**Maps & Data Visualization:**

* **Map Renderer:** [MapLibre GL JS](https://maplibre.org/) & [React Map GL](https://visgl.github.io/react-map-gl/)
* **Charts:** [Recharts](https://recharts.org/)
* **Geospatial Processing:** [Turf.js](https://turfjs.org/)

**AI & Data Engineering Ecosystem:**
- **Deep Learning Model:** **GRU** (Gated Recurrent Unit) optimized via **Aggregate Weak Supervision** (predicting sub-district levels and calculating loss against district-level ground truth).
- **Computer Vision (CNN):** Extracting 34 image embeddings directly from high-resolution satellite imagery.
- **NLP / Silver Annotation:** **Qwen3-8B** (via vLLM) utilized as a silver annotator to process over 30,000 local news articles into 12 poverty-related topics and qualitative attributes.
- **RAG Engine (Retrieval-Augmented Generation):** Hosted on **Modal.com**. Uses **Hybrid Retrieval** combining Dense Search (**FAISS** + `text-embedding-3-small`) and Sparse Search (**BM25**), merged via **Reciprocal Rank Fusion (RRF)**.
- **Explainable AI:** **SHAP GradientExplainer** for generating global/local feature importance, which are translated into narratives for the RAG system.
- **Hosting / Deployment:** [Vercel](https://vercel.com/) (Frontend) & [Modal](https://modal.com/) (RAG Inference API)

## 🚀 Getting Started (Local Development)

To run this project locally on your machine, follow these steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/poverty-map-web.git
   cd poverty-map-web
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## 📂 Project Structure

```text
poverty-map-web/
├── public/
│   ├── api/             # Pre-computed JSON data (Predictions, NLP, GeoJSONs)
│   └── data/            # Raw CSV data references
├── src/
│   ├── components/      # React UI Components (MapStage, Sidebars, Charts)
│   ├── App.tsx          # Main Application Layout & State
│   ├── api.ts           # Data Fetching & Aggregation Logic
│   └── index.css        # Global Tailwind Styles
├── scripts/             # Data processing & API generation scripts
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## 🧠 How the AI Works

Our architecture utilizes a **Multimodal Fusion** approach spanning three core domains:

1. **Spatial & Vision Modality (PCD + IMAGE):** We process satellite imagery to extract 16 structured spatial indices (NDVI, NDBI, NDWI, NTL, VANUI, etc.) and 34 deep CNN embedding features.
2. **Text Modality (NLP & RAG):** Over 30,000 local East Java news articles are scraped and labeled using **Qwen3-8B** to extract poverty-related event scores (e.g., Infrastructure, Health, Employment).
3. **Multimodal Deep Learning (GRU):** The **GRU (Gated Recurrent Unit)** model fuses these modalities to predict poverty percentages. It uses a novel **Aggregate Weak Supervision** technique to estimate *Kecamatan* (sub-district) rates by breaking down available BPS *Kabupaten* (district) data.
4. **Direct District Benchmark:** The dashboard also exposes district-level benchmark runs that predict official *Kabupaten/Kota* poverty rates directly. In sub-district views, those values are projected to kecamatan within the same district for comparison against Aggregate runs.
5. **Explainable AI (SHAP) to RAG Pipeline:** Using `shap.GradientExplainer`, the model outputs the driving factors for each region's poverty rate. These SHAP outputs are converted into textual narratives and injected into our 70,000+ chunks RAG corpus.
6. **RAG Inference API:** Hosted on **Modal.com**, the QA system employs a **Hybrid Retrieval** strategy (FAISS Dense Search via `openai/text-embedding-3-small` + BM25 Sparse Search) fused with **Reciprocal Rank Fusion (RRF)**. The final answers are generated by **Qwen 2.5 7B Instruct** (running efficiently with 4-bit quantization) to dynamically explain the "Why" behind every regional prediction.

## 📄 License

This project is created for NLP and Deep Learning Final Project - Institut Teknologi Sepuluh Nopember).

---
