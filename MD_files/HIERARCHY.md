
## **CODEPRAC 2.0 – Hierarchy With Mandatory Details**

> **Global Rule (Applies to ALL users):**
> Every user account **must have**:
>
> * **Email ID** (unique, primary identifier)
> * **Password** (initial or reset-based)

---

## **1. College**

### **Entity Type**

Top-level organizational unit

### **Required Details**

* **college_name** (string, unique)
* **email** (official college admin email)
* **password** (for college-level login)
* **status** (enabled / disabled)

### **Optional / Metadata**

* created_at
* updated_at

### **Relationships**

* Parent: none
* Children:

  * Departments
  * Batches (indirect)
  * Students (indirect)

---

## **2. Department**

### **Entity Type**

Child of College

### **Required Details**

* **department_name** (string)
* **college_id** (foreign key – mandatory)
* **email** (department login email)
* **password** (for department login)
* **status** (enabled / disabled)

### **Optional / Metadata**

* created_at
* updated_at

### **Relationships**

* Parent:

  * College
* Children:

  * Batches
  * Students

---

## **3. Batch**

### **Entity Type**

Child of College + Department

### **Required Details**

* **batch_name** (string, e.g., `2023–2027`)
* **college_id** (foreign key – mandatory)
* **department_id** (foreign key – mandatory)
* **email** (batch-level login, if applicable)
* **password** (if batch login exists)
* **status** (enabled / disabled)

### **Optional / Metadata**

* start_year
* end_year
* created_at

### **Relationships**

* Parents:

  * College
  * Department
* Children:

  * Students

---

## **4. Student**

### **Entity Type**

Leaf-level user

### **Required Details**

* **username** (display name)
* **email** (login identifier)
* **password** (initial password; reset later)
* **college_id** (mandatory)
* **department_id** (mandatory)
* **batch_id** (mandatory)
* **status** (enabled / disabled)

### **Optional / Metadata**

* roll_number
* created_at
* last_login

---

## **Hierarchy Validation Rules (Hard Constraints)**

These rules must be enforced **both frontend and backend**:

1. **Department**

   * Cannot be created without selecting a College
2. **Batch**

   * Cannot be created without selecting:

     * College
     * Department
3. **Student**

   * Cannot be created without selecting:

     * College
     * Department
     * Batch
4. **Email + Password**

   * Mandatory for **every user entity**
5. **Disable Propagation**

   * If College is disabled → all children blocked
   * If Department is disabled → its batches & students blocked
   * If Batch is disabled → its students blocked

---

## **Frontend Form Expectations (Derived From This Model)**

### **Student Creation Form**

Must include:

1. College (dropdown – required)
2. Department (dropdown – required, depends on College)
3. Batch (dropdown – required, depends on Department)
4. Username
5. Email
6. Password

### **Department Creation Form**

Must include:

1. College (dropdown – required)
2. Department Name
3. Email
4. Password

### **Batch Creation Form**

Must include:

1. College (dropdown – required)
2. Department (dropdown – required)
3. Batch Name
4. Email (if batch login exists)
5. Password

---

## **Why This Solves Your Current Issues**

* Prevents orphan records
* Fixes invisible dropdowns
* Makes CRUD reuse possible
* Enables correct disable logic
* Aligns frontend payloads with backend expectations

---


