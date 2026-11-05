# منابع، مراجع و انتساب تصاویر

این سند، فهرست کامل و قابل ردیابی منابع ارائهٔ AI-RAN است. هر کارت روی بوم، در پایین خود نشان منبع دارد؛ کلید هر منبع در ادامه آمده است.

دسته‌بندی: **رسمی** (وایت‌پیپر/معماری اتحاد) · **استاندارد/اتحاد** · **پژوهشی** · **سازنده** · **ابزار** · **اسناد پروژه**

---

## ۱. اسناد رسمی AI-RAN Alliance

| کلید | سند | سازمان | پیوند |
|---|---|---|---|
| `wg1` | AI-RAN WG1 — *AI-for-RAN Whitepaper* (TG#1: State-of-the-Art AI/ML Applications for Improvements in RAN Performance) | AI-RAN Alliance | https://ai-ran.org/documents/AI-RAN-WG1-AI-for-RAN-Whitepaper.pdf |
| `wg3` | AI-RAN WG3 — *AI-on-RAN Whitepaper* (AI-on-RAN: Enabling Monetizable Differentiated Connectivity for AI) | AI-RAN Alliance | https://ai-ran.org/documents/AI-RAN-WG3-AI-on-RAN-Whitepaper.pdf |
| `vision` | *AI-RAN Alliance — Vision and Mission Whitepaper* | AI-RAN Alliance | https://ai-ran.org/documents/AI-RAN-Alliance-Whitepaper.pdf |
| `arch` | *AI-RAN Architecture Overview and Component Definitions*, Version 1.2 | AI-RAN Alliance | https://ai-ran.org/documents/AI-RAN-Architecture-v1.2.pdf |
| `pi` | *AI-RAN Platform and Infrastructure Orchestrator* (WG2) — نسخهٔ بررسی‌شده: `10-rc1`، آخرین تغییر ثبت‌شده ۲۹ اکتبر ۲۰۲۵ | AI-RAN Alliance | https://ai-ran.org/documents/AI-RAN-Platform-Infrastructure-Orchestrator.pdf |
| `alliance` | وب‌سایت رسمی اتحاد | AI-RAN Alliance | https://ai-ran.org/ |

**آنچه از این اسناد در ارائه استفاده شده است**

- `wg1`: ساختار کارکردهای AI-RAN (شکل ۱)، سه مرحلهٔ تکامل رابط هوایی (شکل ۲)، بازخورد CSI با Autoencoder (شکل ۳)، Beamforming چندکاربره (شکل ۴)، Beam Management با AI/ML (شکل ۵)، D-MIMO با بهینه‌سازی AI/ML (شکل ۶)، خاموشی آنتن (شکل ۷)، مدیریت منابع رادیویی، بهره‌وری انرژی، مدیریت شبکه، ISAC، امنیت و موضوع‌های نوظهور.
- `wg3`: اولویت قابلیت پیش‌بینی بر سرعت اوج، بهینه‌سازی Uplink، تأخیر کران‌دار و Jitter، Slicing/QoS، Edge Computing، ارکستراسیون حلقه‌بسته، مدل‌های درآمدی و QoD، چارچوب‌های RAIE/NWDAF/NEF/CAMARA/MEC و پنج توصیهٔ پایانی.
- `arch`: سه حوزهٔ عملکردی معماری (زیرساخت، بارهای کاری، مدیریت/کنترل/هماهنگ‌سازی)، اجزای Orchestrator، نقش `dUPF` در خروج محلی، MLOps و پلتفرم داده، Multi-Agent Manager، و جایگاه UE و شبکهٔ هسته (NWDAF).
- `pi`: سه سناریوی اشتراک منابع (A/B/C)، پنج کاربرد Orchestrator، پنج تابع (MCMF/MCF/MCSF/DSF/RAF)، رابط‌های NBI/E-WBI/SBI و تفاوت با SMO.
- `vision`: یازده عضو مؤسس، مأموریت، سه گروه کاری و اهداف راهبردی.

## ۲. استانداردها و اتحادهای صنعتی

| کلید | مرجع | سازمان | پیوند |
|---|---|---|---|
| `oran` | مشخصات و معماری RAN باز (RIC، E2، A1، xApp/rApp) | O-RAN Alliance | https://www.o-ran.org/ |
| `gpp` | مطالعات AI/ML برای NR — Release 18/19/20 | 3GPP | https://www.3gpp.org/ |

3GPP یک سازمان توسعهٔ استاندارد است؛ O-RAN Alliance چارچوب معماری باز را تعریف می‌کند. هیچ‌کدام «محصول» نیستند و در ارائه همین‌گونه معرفی شده‌اند.

## ۳. منابع پژوهشی

| کلید | مرجع | توضیح |
|---|---|---|
| `sionnart` | *Sionna RT: Differentiable Ray Tracing for Radio Propagation Modeling* | NVIDIA Research — مبنای توضیح Ray Tracing قابل مشتق‌گیری |
| — | `DeepRx` (گیرندهٔ کانولوشنی برای OFDM، تولید LLR) | نمونهٔ پژوهشی مطرح‌شده در خلاصهٔ WG1؛ در ارائه به‌عنوان نمونهٔ پژوهشی معرفی شده، نه محصول |
| — | `CsiNet` (فشرده‌سازی CSI با Autoencoder) | نمونهٔ پژوهشی مطرح‌شده در WG1 (شکل ۳) |
| — | `Deep RAN`، `FALCON`، `Simba`، `GRAPHICA` | نمونه‌های پژوهشی تشخیص ناهنجاری/تعارض xApp که در WG1 بررسی شده‌اند |

> توجه: برای این موارد، در ارائه فقط «نام و کارکرد» ذکر شده و هیچ عدد عملکردی به آن‌ها نسبت داده نشده است.

## ۴. مستندات سازندگان

| کلید | مرجع | سازمان | پیوند |
|---|---|---|---|
| `nvidia` | AI-RAN solutions for 5G and 6G | NVIDIA | https://www.nvidia.com/en-us/industries/telecommunications/ai-ran/ |
| `ericsson` | AI RAN | Ericsson | https://www.ericsson.com/en/ai/ran |
| `nokia` | AI-RAN platform | Nokia | https://www.nokia.com/radio-access/ai-ran/ |

**ادعاهای سازنده‌ای که در ارائه با احتیاط و با انتساب آمده‌اند**

- NVIDIA: افزایش ۲ تا ۳ برابری بهره‌وری منابع با تخصیص پویا (ادعای سازنده؛ در ارائه به‌عنوان ادعا و نه تضمین ذکر شده).
- Ericsson: نتایج آزمایش شبکهٔ زنده با T-Mobile (حدود ۱۰٪ بهبود بهره‌وری طیفی و تا ۱۵٪ افزایش Throughput نزولی، در سناریوهای مشخص).
- Nokia / Deutsche Telekom: تخمین کانال Uplink مبتنی بر AI در آزمایشگاه‌های Bonn و Oulu (بهبود معمول ۱۰ تا ۱۵ درصدی Throughput در اندازه‌گیری‌های اولیه).
- اعلام همکاری‌ها و آزمایش‌های اپراتوری (T-Mobile، Elisa، Deutsche Telekom، Orange، BT) در سطح «اعلام شرکت» و با تفکیک سطح بلوغ نقل شده‌اند.

## ۵. ابزارها و مستندات فنی

| کلید | مرجع | سازمان | پیوند |
|---|---|---|---|
| `aerial` | Aerial CUDA-Accelerated RAN (cuPHY، cuMAC، cuBB، pyAerial) | NVIDIA | https://docs.nvidia.com/aerial/cuda-accelerated-ran/latest/index.html |
| `aerialfw` | Aerial Framework (MLIR/TensorRT، CUDA Graphs، GPUDirect RDMA) | NVIDIA | https://docs.nvidia.com/aerial/framework/latest/ |
| `aodt` | Aerial Omniverse Digital Twin | NVIDIA | https://docs.nvidia.com/aerial/aodt/welcome |
| `sionna` | Sionna (RT / PHY / SYS) | NVIDIA | https://developer.nvidia.com/sionna |
| `oai` | OpenAirInterface — پیاده‌سازی متن‌باز 4G/5G | OSA / EURECOM | https://openairinterface.org/ |
| `flexric` | FlexRIC — پیاده‌سازی Near-RT RIC | EURECOM Mosaic5G | https://gitlab.eurecom.fr/mosaic5g/flexric |

**تفکیک نوع ابزار (همان‌گونه که در ارائه آمده است)**

- Sionna = کتابخانهٔ شبیه‌سازی و تحقیق (نه RAN عملیاتی)
- Aerial CUDA-Accelerated RAN = پشتهٔ نرم‌افزاری شتاب‌یافته (نه شبیه‌ساز)
- Aerial Framework = چارچوب توسعه و اجرای بلادرنگ (نه محصول سخت‌افزاری)
- AODT = محیط دیجیتال توین (نه شبکهٔ زنده)
- ARC = خانوادهٔ سخت‌افزاری
- OpenAirInterface = پیاده‌سازی نرم‌افزاری شبکه (نه معماری)
- FlexRIC = پیاده‌سازی RIC (نه استاندارد)
- O-RAN = معماری و مشخصات (نه نرم‌افزار)
- AI-RAN = چارچوب معماری (نه یک محصول)

## ۶. اسناد پروژه

| کلید | مورد |
|---|---|
| `local` | مجموعهٔ اسناد پژوهشی پروژه: خلاصه‌ها و ترجمه‌های محلی وایت‌پیپرهای WG1/WG3، سند معماری، سند Orchestrator، و یادداشت‌های وب‌سایت‌های NVIDIA/Nokia/Ericsson |

این اسناد برای جهت‌دهی، ساختاردهی و اعتبارسنجی متقابل استفاده شده‌اند؛ در هر ادعای حساس، به منبع اصلی (وایت‌پیپر یا مستندات رسمی) ارجاع شده است.

---

## ۷. انتساب تصاویر

| فایل | منبع | وضعیت |
|---|---|---|
| `ai-ran-architecture.png` | AI-RAN Alliance — *AI-RAN Architecture v1.2*، بخش ۲٫۱ | شکل رسمی |
| `wg1-functionality-map.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 1 | شکل رسمی |
| `wg1-air-interface-evolution.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 2 | شکل رسمی |
| `wg1-csi-autoencoder.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 3 (adapted from Guo+22) | شکل رسمی |
| `wg1-mu-mimo-beamforming.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 4 | شکل رسمی |
| `wg1-beam-management.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 5 | شکل رسمی |
| `wg1-distributed-mimo.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 6 | شکل رسمی |
| `wg1-antenna-muting.png` | AI-RAN Alliance — WG1 Whitepaper، Fig. 7 (adapted from Raj+24) | شکل رسمی |
| `ai-and-ran-shared-resources.png` | AI-RAN Alliance — WG2 P&I Orchestrator، Fig. 1 (Scenario A) | شکل رسمی |
| `ai-and-ran-scenarios-bc.png` | AI-RAN Alliance — WG2 P&I Orchestrator، Fig. 2 & 3 (Scenario B/C) | شکل رسمی |
| `ai-ran-network-overview.png` | AI-RAN Alliance — WG2 P&I Orchestrator، Fig. 5 | شکل رسمی |
| `ai-ran-orchestrator-arch.png` | AI-RAN Alliance — WG2 P&I Orchestrator، Fig. 6 | شکل رسمی |
| `sionna-rt-radio-map.jpg`، `sionna-rt-ray-paths.jpg` | NVIDIA Sionna RT — دارایی‌های تصویری پروژه | تصویر ابزار (نه معماری رسمی محصول) |
| `ai-grade-shift.png`، `mobile-native-ai-agent.png`، `predictability-vs-peak-rate.png`، `ai-grade-pillars.png`، `monetizing-pain-moments.png` | تصویرسازی آموزشی از دارایی‌های پروژه، بر پایهٔ محتوای وایت‌پیپر WG3 | تصویرسازی آموزشی — نمودار رسمی نیست |
| `5g-three-layers.png`، `ngran-topology.png`، `rf-coverage-cells.png` | تصاویر آموزشی عمومی از دارایی‌های پروژه | بدون ادعای رسمی بودن |

**قاعدهٔ استفاده:** هیچ تصویر عمومی/تزئینی جای نمودار فنی را نگرفته است؛ هر جا نمودار رسمی وجود داشت، همان استفاده شده و هر جا نمودار رسمی موجود نبود، یک نمودار مفهومی با برچسب صریح «نمودار مفهومی» ساخته شده است.

---

## ۸. نمودارهای مفهومی ساخته‌شده برای این ارائه

این ۱۸ نمودار در `js/visualizations.js` به‌صورت SVG درون‌خطی تولید می‌شوند و در زیرنویس هر کارت با عبارت «نمودار مفهومی» علامت خورده‌اند:

`timeline` (تحول RAN) · `threeBranches` (سه شاخه) · `closedLoop` (حلقهٔ بسته) · `trafficForecast` (پیش‌بینی ترافیک) · `scheduler` (زمان‌بندی چندهدفه) · `anomaly` (تشخیص ناهنجاری) · `rl` (یادگیری تقویتی) · `forVsIn` (مرز for/in) · `stack` (پشتهٔ پروتکل) · `channelEst` (تخمین کانال) · `neuralRx` (گیرندهٔ عصبی) · `ric` (O-RAN/RIC) · `lab` (زنجیرهٔ آزمایشگاهی) · `edgeArch` (معماری Edge و dUPF) · `aerial` (پشتهٔ Aerial) · `stack3` (سه شاخه در یک معماری) · `scenario3` (یک سناریو، سه لایه) · `maturity` (نردبان بلوغ)

---

## ۹. مواردی که در این ارائه ادعا نشده‌اند

برای شفافیت، این موارد عمداً مطرح نشده یا با قید آمده‌اند:

- هیچ عدد عملکردی «تضمین‌شده» برای AI-RAN ارائه نشده است.
- «اولین تماس AI-RAN» یا «آزمایش موفق» به «استقرار تجاری سراسری» ترجمه نشده است.
- AI-native 6G به‌عنوان قابلیت امروز معرفی نشده است.
- RIC به‌عنوان بخشی از لایهٔ فیزیکی معرفی نشده است.
- Sionna/OAI/FlexRIC به‌عنوان «شبکهٔ عملیاتی» معرفی نشده‌اند.
- محتوای پوشهٔ `KPI` پروژه بررسی و استفاده نشده است.
