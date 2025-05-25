# Your Khata - Money Tracking App Plan

## Overview
Your Khata is a mobile application for tracking money borrowed and lent between individuals. Users can add contacts, record transactions, and view balances with each contact.

## Screens

### 1. Home Screen ✅
- Summary section: ✅
  - Total money to receive (Maine lene hain) ✅
  - Total money to give (Maine dene hain) ✅
- Search functionality for customers ✅
- Sorted list of contacts with: ✅
  - Initials/avatar ✅
  - Name ✅
  - Amount (color-coded: red for receiving, green for giving) ✅
- Add Customer button ✅
- Bottom navigation (Khata, Batwa, Account) ✅

### 2. Customer Detail Screen ✅
- Customer name and total balance ✅
- Communication options (SMS, WhatsApp) ✅
- Reports generation ✅
- Transaction history with: ✅
  - Date and time ✅
  - Transaction amount (color-coded) ✅
  - Running balance ✅
- Action buttons: ✅
  - "Maine Diye" (I Gave) - to record money given ✅
  - "Maine Liye" (I Took) - to record money received ✅

### 3. Add Customer Screen ✅
- Name input field ✅
- Phone number input ✅
- Option to select from contacts ✅
- Initial transaction amount (optional) ✅
- Transaction type (gave/received) ✅

### 4. Add Transaction Screen ✅
- Amount input ✅
- Transaction type (gave/received) ✅
- Date picker (default to current) ✅
- Optional notes/description ✅

### 5. Reports Screen ✅
- Date range selection ✅
- Filter by customer ✅
- Transaction summary ✅

### 6. Account Screen ✅
- User profile information: ✅
  - Name (editable) ✅
  - Phone number (editable) ✅
  - Profile picture upload
- About app information ✅
- Privacy policy ✅

### 7. Batwa Screen ✅
- Personal expense tracking ✅
- Income and expense categories ✅
- Monthly budget setting ✅
- Expense summary with charts ✅
- Add expense/income entry ✅
- Filter expenses by date/category ✅

## Data Models

### User ✅
- id ✅
- name ✅
- phoneNumber ✅
- profilePicture ✅

### Contact ✅
- id ✅
- name ✅
- phoneNumber ✅
- currentBalance (positive for money to receive, negative for money to give) ✅

### Transaction ✅
- id ✅
- contactId ✅
- amount ✅
- type (gave/received) ✅
- timestamp ✅
- notes ✅
- runningBalance ✅

### BatwaTransaction ✅
- id ✅
- amount ✅
- type (income/expense) ✅
- category ✅
- timestamp ✅
- notes ✅

## Technical Stack

### Frontend
- React Native with Expo ✅
- React Navigation for routing ✅
- Redux or Context API for state management ✅
- React Native Paper or custom components for UI ✅

### Storage
- AsyncStorage for local storage (All data will be stored locally only) ✅

### Additional Features
- Contact integration ✅
- SMS/WhatsApp integration ✅
- Dark theme ✅

## Implementation Plan

### Phase 1: Basic Setup ✅
- Initialize Expo project ✅
- Set up navigation structure ✅
- Create basic UI components ✅

### Phase 2: Core Functionality ✅
- Update tab navigation for Khata, Batwa, Account ✅
- Implement Home screen with dummy data ✅
- Navigation between screens ✅
- Create Customer Detail screen ✅
- Build Add Customer functionality ✅
- Implement transaction recording ✅

### Phase 3: Enhanced Features ✅
- Add search functionality ✅
- Implement communication features (SMS/WhatsApp) ✅
- Implement Account screen with profile editing ✅
- Implement Batwa functionality for personal expense tracking ✅

### Phase 4: Data Management ✅
- Set up local data persistence with AsyncStorage ✅
- Add data validation and error handling ✅

### Phase 5: Polishing ✅
- UI/UX enhancements ✅
- Performance optimization ✅
- Testing and bug fixes ✅

## Technical Considerations ✅
- Ensure proper handling of financial calculations ✅
- Implement proper form validation ✅
- Consider offline-first approach ✅
- Plan for data migration for future updates ✅

## Tasks

1. [x] Remove the lock button from the batwa section
   - No action needed as there is no lock button in the batwa section
   - Lock functionality is controlled through the account settings

2. [x] Add delete button for profiles
   - Added delete button UI next to each profile in the dropdown
   - Delete functionality already implemented in StorageUtils
   - Confirmation dialog already implemented
   - Added styles for the delete button

3. [x] Remove data management section from account section
   - No action needed as there is no data management section in the account screen
   - The account screen only contains Profile Information, Security, Appearance, and About sections

## Progress Tracking

All tasks have been completed.
