# Broker Deal Tracker

A comprehensive React web application for managing broker deals, suppliers, buyers, and brokerage calculations with real-time financial computations.

## 🚀 Features

- **Real-time Financial Calculations** with multiple calculation modes
- **Deal Management** - Create, edit, delete deals with comprehensive tracking
- **Supplier & Buyer Management** - Maintain business contacts database
- **Advanced Filtering & Search** across all data fields
- **Export Functionality** - CSV export for reports and data backup
- **Payment Status Workflow** - Track deals from pending to paid
- **Smart Alerts System** - Overdue payments and business notifications
- **Responsive Dashboard** - Professional UI with statistics and analytics

## 🛠️ Tech Stack

- **Frontend**: React 18.2.0 with Hooks
- **Styling**: Tailwind CSS 3.3.0
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Storage**: Browser localStorage
- **Build Tool**: Create React App

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/aarinkrishnaa/deal_tracker_mern.git

# Navigate to project directory
cd deal_tracker_mern

# Install dependencies
npm install

# Start development server
npm start
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main overview with stats and recent deals
│   ├── DealEntry.js          # Deal creation with real-time calculations
│   ├── Reports.js            # Advanced filtering and analytics
│   ├── GoodsDelivered.js     # Delivery tracking and payment management
│   └── DataReset.js          # Data management utilities
├── utils/
│   └── localStorage.js       # Data persistence API
├── App.js                    # Main application component
└── index.js                  # Application entry point
```

## 💼 Business Logic

### Calculation Modes
- **Rate per KG**: Automatic unit conversion with weight calculations
- **Direct Rate**: Simple rate × quantity calculations

### Brokerage Models
- **Percentage-based**: Calculated on amount after discount (before GST)
- **Per-bag**: Fixed amount per quantity unit

### Payment Workflow
1. **Pending** → **Delivered** → **Paid**
2. Automatic overdue detection (15+ days for deliveries, 30+ days for payments)
3. Smart alerts for business management

## 📊 Key Components

### Dashboard
- Statistics cards with clickable filters
- Smart alerts for overdue payments and inactive suppliers
- Recent deals table with inline status updates
- Export functionality

### Deal Entry
- Real-time calculation panel
- Supplier/Buyer management with inline modals
- Multiple calculation and brokerage modes
- Form validation and error handling

### Reports
- Advanced filtering (date range, supplier, buyer, status)
- Summary analytics cards
- Complete deal history with export

### Goods Delivered
- Delivery tracking with days since delivery
- Payment status management
- Overdue delivery alerts
- Filtered views and export

## 🔧 Usage

1. **Add Suppliers & Buyers**: Use the "Add New" buttons in deal entry
2. **Create Deals**: Fill the deal form with real-time calculation preview
3. **Track Progress**: Monitor deals through Dashboard and Goods Delivered
4. **Generate Reports**: Use Reports section for detailed analysis
5. **Export Data**: CSV export available in all major sections

## 📱 Responsive Design

- Mobile-friendly interface
- Responsive grid layouts
- Touch-friendly buttons and forms
- Optimized for all screen sizes

## 🔒 Data Storage

- Uses browser localStorage for data persistence
- No external database required
- Data remains local to user's browser
- Export functionality for data backup

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy the build folder to your hosting service
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Developer

**Aarin Krishna**
- GitHub: [@aarinkrishnaa](https://github.com/aarinkrishnaa)

---

*Built with ❤️ using React and Tailwind CSS*