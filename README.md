<div align="center">

<!-- Animated Header -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=35&duration=4000&pause=1000&color=10B981&center=true&vCenter=true&width=800&lines=LocalShare+Pipeline;Zero-Config+LAN+File+Transfer;Real-time+WebSocket+Synchronization;Secure.+Ephemeral.+Blazing+Fast.">
  <img alt="LocalShare Animated Header" src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=35&duration=4000&pause=1000&color=10B981&center=true&vCenter=true&width=800&lines=LocalShare+Pipeline;Zero-Config+LAN+File+Transfer;Real-time+WebSocket+Synchronization;Secure.+Ephemeral.+Blazing+Fast.">
</picture>

**An enterprise-grade, zero-configuration local file and text sharing orchestration engine.**

[![Docker Ready](https://img.shields.io/badge/Docker-Containerized-10B981?style=for-the-badge&logo=docker&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js_18+-1a1a1a?style=for-the-badge&logo=nodedotjs&logoColor=10B981)](#)
[![Socket.io](https://img.shields.io/badge/Protocol-WebSockets-10B981?style=for-the-badge&logo=socketdotio&logoColor=white)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Event_Driven-1a1a1a?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](#)

</div>

---

## ⚡ Overview

**LocalShare** is a high-performance, real-time signaling and file-transfer gateway designed to facilitate seamless data exchange across localized network environments. Built with a focus on **ephemeral data management** and **low-latency WebSocket orchestration**, it provides an AirDrop-like experience across any operating system without requiring client-side installations, complex authentication, or external cloud storage.

Designed with a cinematic, glassmorphism-inspired UI and an airtight backend, it demonstrates core principles of modern systems engineering: **state isolation, automated garbage collection, and real-time bidirectional communication.**

## 🚀 Technical Capabilities

*   **🌐 IP-Based Network Multiplexing:** Automatically partitions user sessions into isolated WebSocket rooms based on their public/LAN IPv4 footprint.
*   **⏱️ Real-Time State Synchronization:** Sub-millisecond text and presence synchronization leveraging `Socket.io` event emission.
*   **🗑️ Ephemeral Storage & Garbage Collection:** Implements an automated, non-blocking cron interval that securely sanitizes server disk space by purging orphaned assets every 30 minutes.
*   **🐳 Containerized & Cloud-Agnostic:** Fully Dockerized for horizontal scaling and rapid deployment on platforms like Hugging Face Spaces, Fly.io, or AWS ECS.
*   **🎨 Zero-Dependency UI:** A pristine, vanilla HTML5/CSS3 frontend utilizing CSS Grid and minimal DOM manipulation for maximum render efficiency.

---

## 📐 System Architecture

The following diagram illustrates the event-driven routing and IP-based room isolation that ensures absolute privacy between distinct network environments.

```mermaid
graph TD
    subgraph "Network A (e.g., Office LAN)"
        ClientA1[Laptop - User A]
        ClientA2[Mobile - User B]
    end

    subgraph "Network B (e.g., Coffee Shop)"
        ClientB1[Tablet - User C]
    end

    Gateway[Node.js + Express Gateway]
    WS[WebSocket Orchestrator]
    Storage[(Ephemeral Disk Storage)]
    Garbage[Garbage Collector]

    ClientA1 <-->|HTTPS / WSS| Gateway
    ClientA2 <-->|HTTPS / WSS| Gateway
    ClientB1 <-->|HTTPS / WSS| Gateway

    Gateway -->|Handshake| WS
    
    WS -->|Join Room: IP A| RoomA{Isolated State A}
    WS -->|Join Room: IP B| RoomB{Isolated State B}

    RoomA -.->|State Sync| ClientA1
    RoomA -.->|State Sync| ClientA2
    RoomB -.->|State Sync| ClientB1

    Gateway -->|Stream File| Storage
    Garbage -->|Sanitize > 30m| Storage

    classDef core fill:#1a1a1a,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef client fill:#2a2a2a,stroke:#444,stroke-width:1px,color:#ddd;
    classDef storage fill:#0d1117,stroke:#10B981,stroke-width:1px,color:#fff;
    
    class Gateway,WS,Garbage core;
    class ClientA1,ClientA2,ClientB1 client;
    class Storage,RoomA,RoomB storage;

```

---

## 🛠️ Tech Stack & Engineering Choices

| Component | Technology | Rationale |
| --- | --- | --- |
| **Core Runtime** | `Node.js` | Asynchronous, event-driven architecture ideal for persistent I/O operations. |
| **Transport Layer** | `Socket.io` | Ensures connection resilience with fallback polling and native broadcasting capabilities. |
| **HTTP Routing** | `Express.js` | Lightweight middleware pipeline for efficient static asset serving and RESTful endpoints. |
| **Multipart Parsing** | `Multer` | High-throughput streaming of binary file data directly to the filesystem. |
| **Containerization** | `Docker` | Guarantees environmental parity across development, testing, and production phases. |

---

## 🚦 Getting Started

### Prerequisites

* Node.js (v18.x or higher)
* Docker (Optional, for containerized environments)

### Local Development Startup

1. **Clone the repository:**

```bash
   git clone [https://github.com/SunbalAzizLCWU/lanshare.git](https://github.com/SunbalAzizLCWU/lanshare.git)
   cd localshare

```

2. **Install dependencies:**

```bash
   npm install

```

3. **Initialize the server:**

```bash
   npm start

```

*The orchestration engine will initialize on `http://localhost:3000` and automatically bind to your machine's local IPv4 address.*

### Enterprise Deployment (Docker)

To deploy the service in an isolated container:

```bash
# Build the image
docker build -t sunbalazizlcwu/localshare:latest .

# Run the container mapping port 3000
docker run -d -p 3000:3000 --name localshare-node sunbalazizlcwu/localshare:latest

```

---

## 👨‍💻 Engineering Lead

**Sunbal Aziz**

*AI & ML Engineer | Full-Stack Developer*

Architecting robust, intelligent pipelines and highly scalable web infrastructure.

* **GitHub:** [@SunbalAzizLCWU](https://github.com/SunbalAzizLCWU)
* **Status:** Open to B2B Consulting & Engineering Roles
