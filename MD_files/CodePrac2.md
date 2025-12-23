# CODEPRAC 2.0

## 3 tire

### admin (enable or disable college) dashboard wrt each , also department regitration  
### college (add students through csv (user name, mail, temp-password)) -> send mail, student details dashboard with track progress (breakdown wrt year)  
### upload option for notes  
### student -> attend question (not able to create acc) reset password through firebase  

---

## CODEPRAC 2.0:-

this is an static webapp where student can practice the questions posted by their departments and check their answers through ai and the admin manages colleges, departments, batches and can view allt he students performance data  
similarly colleges can see their own students performance data and so do departments  

---

## tire 1

### ADMIN:

admin should be able to create different colleges, and under colleges he should be able to create different departments and each departments will have differen levels of student batches like batch 2023 to 2027 for these categories and sub categories let it be in string  

admin can manage colleges and departments and can view all the students data (basically CRUD)  

other than this the admin should have ability to enable or disable the ability to use the platform in college level , department level and the batch level  

#### example:

for example if the batch 2022 to 2026 in AIML department from college abc have completed then the admin should be able to disable the service for them so basically the accounts in the batch 2022 to 2026 in AIML department from college abc will not be able to even login  

similarly if the department is disabled all the student under that department will not be able to login to the app irrespective of the batch they are in  

and similarly if a collage is disabled then all the students, departments cannot login to the app  

disabling dosent mean they are removed from the db it mean they just cant login to the app and use it  

the admin should be able to monitor/view all the performance data of students from different students from different departments and different batch  

like the admin should select the college then department then batch to view the required students performance  

---

## tire 2:

### college :

college an create username and password for departments  

here basically college will be able to do CRUD operations to the departments  

similar to admin college can see all their students performance wrt their department and batch  

college should select the department and the batch to view the students performance data  

---

### departments:

departments can create batches and add students by going into one of the batch and can be added using a csv file where the csv file will have user name , mailid and initial password  

the students should be able login with the mail id and then they should be able to reset the password later via email  

the departments can create the CP questions  

for that they will need the following  

- to with batch do they post the question to  
- under what topic is the question is  
- the question description  
- sample inputs and outputs  
- then a button that will create the hidden teascases using ai (already the agent is implemented)  

so the departments should be able to do crud operations on topics, batches, questions  

---

## tire 3:

### student :

here the student will first login with the id password gave from his department  

then in his profile he will have an option to reset his password via mail (here we use firebase for that)  

then in the main page the student will see the topics that their departments gave and each topic will have a dropbox to reveal all the questions inside the topic that was given by the department  

then after selecting the question the student will go to a page similar to leetcode interface  

where the question will be in the right side then the monoco code editor will be in the top right section  

and the open testcase, hidden testcase and custom testcase will be at the bottom right section  

also here we will have 3 agents  

#### agents:

- compiler agent : runs the code in the code editor wrt the langusge and execute it (already the agent is implemented)  
- evaluation agent : checks if the entered code is correct wrt the question testcases and the question description (already the agent is implemented)  
- efficiency agent : will go through the code and the question and gives the efficient approach if any after submitting and getting it correct (already the agent is implemented)  

---

## tech stack and external APIs:

### frontend :
static html, css, js  

### backend:
flask, python  

### AI :
llama-3.3-70b-versatile  

### AI architecture :
multiagent architecture  

### API :
Groq api (for ai api key)  

---

## deployment:

### frontend :
GitHub  

### backend :
render  
