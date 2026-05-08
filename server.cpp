#include <iostream>
#include <string>
#include <vector>
#include "httplib.h"
#include "json.hpp"

using namespace std;
using json = nlohmann::json;


class Account {
protected:
    string accountNum;
    string password;
    double balance;
    string accountType;

public:
    Account(string id, string pass, double bal, string type) 
        : accountNum(id), password(pass), balance(bal), accountType(type) {}

    virtual ~Account() {}

    string getID() { return accountNum; }
    string getPass() { return password; }
    double getBalance() { return balance; }
    string getType() { return accountType; }
    
    virtual void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    virtual bool withdraw(double amount) = 0;
};

class CheckingAccount : public Account {
private:
    const double withdrawLimit = 8000; 
public:
    CheckingAccount(string id, string pass, double bal) 
        : Account(id, pass, bal, "Checking") {}

    bool withdraw(double amount) override {
        if (amount <= 0 || amount > withdrawLimit || amount > balance) return false;
        balance -= amount;
        return true;
    }
};

class SavingsAccount : public Account {
public:
    SavingsAccount(string id, string pass, double bal) 
        : Account(id, pass, bal, "Savings") {}

    bool withdraw(double amount) override {
        return false;
    }
};

class ATM {
private:
    vector<Account*> accounts;
public:
    ~ATM() { for (auto acc : accounts) delete acc; }

    
    void addAccount(string id, string pass, double initialBal, int typeChoice) {
        if (typeChoice == 1) accounts.push_back(new CheckingAccount(id, pass, initialBal));
        else accounts.push_back(new SavingsAccount(id, pass, initialBal));
        cout << "[Server Log] Account Created -> ID: " << id << " | Balance: " << initialBal << endl;
    }

    
    bool deleteAccount(string id) {
        for (auto it = accounts.begin(); it != accounts.end(); ++it) {
            if ((*it)->getID() == id) {
                delete *it;
                accounts.erase(it); 
                return true;
            }
        }
        return false;
    }

    Account* login(string id, string pass) {
        for (auto acc : accounts) {
            if (acc->getID() == id && acc->getPass() == pass) return acc;
        }
        return nullptr;
    }
    
    Account* getAccount(string id) {
        for (auto acc : accounts) {
            if (acc->getID() == id) return acc;
        }
        return nullptr;
    }
};


int main() {
    ATM system;
    
    
    system.addAccount("101", "0000", 5000.0, 1); 
    system.addAccount("102", "1234", 15000.0, 2); 

    httplib::Server svr;

    svr.Options(R"(.*)", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    });

    svr.Post("/api/login", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];
        string pin = req_json["pin"];

        Account* user = system.login(id, pin);
        json res_json;

        if (user) {
            res_json["status"] = "success";
            res_json["type"] = user->getType();
            cout << "[Login] User " << id << " Logged in." << endl;
        } else {
            res_json["status"] = "error";
            cout << "[Login] Failed attempt for ID: " << id << endl;
        }
        res.set_content(res_json.dump(), "application/json");
    });

    svr.Post("/api/balance", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];

        Account* user = system.getAccount(id);
        json res_json;
        if (user) {
            res_json["status"] = "success";
            res_json["balance"] = user->getBalance();
        } else {
            res_json["status"] = "error";
        }
        res.set_content(res_json.dump(), "application/json");
    });

    svr.Post("/api/deposit", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];
        double amount = req_json["amount"];

        Account* user = system.getAccount(id);
        json res_json;
        if (user) {
            user->deposit(amount);
            res_json["status"] = "success";
            res_json["new_balance"] = user->getBalance();
            cout << "[Deposit] User " << id << " deposited " << amount << ". Remaining: " << user->getBalance() << endl;
        } else {
            res_json["status"] = "error";
            res_json["message"] = "عفواً، حدث خطأ.";
        }
        res.set_content(res_json.dump(), "application/json");
    });

    svr.Post("/api/withdraw", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];
        double amount = req_json["amount"];

        Account* user = system.getAccount(id);
        json res_json;
        if (user) {
            if (user->getType() == "Savings") {
                res_json["status"] = "error";
                res_json["message"] = "عفواً، غير مسموح بالسحب من حسابات التوفير.";
            } else {
                bool success = user->withdraw(amount);
                if (success) {
                    res_json["status"] = "success";
                    res_json["new_balance"] = user->getBalance();
                    cout << "[Withdraw] User " << id << " withdrew " << amount << ". Remaining: " << user->getBalance() << endl;
                } else {
                    res_json["status"] = "error";
                    res_json["message"] = "عفواً، رصيدك لا يكفي لإتمام المعاملة أو تجاوزت الحد الأقصى.";
                }
            }
        }
        res.set_content(res_json.dump(), "application/json");
    });


    svr.Post("/api/admin/add", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];
        string pin = req_json["pin"];
        double balance = req_json["balance"];
        int type = req_json["type"];

        json res_json;
        
        if (system.getAccount(id) != nullptr) {
            res_json["status"] = "error";
            res_json["message"] = "هذا الحساب موجود بالفعل!";
        } else {
            system.addAccount(id, pin, balance, type);
            res_json["status"] = "success";
            cout << "[Admin] SUCCESS: Added Account " << id << endl;
        }
        res.set_content(res_json.dump(), "application/json");
    });

    
    svr.Post("/api/admin/delete", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto req_json = json::parse(req.body);
        string id = req_json["id"];

        json res_json;
        if (system.deleteAccount(id)) {
            res_json["status"] = "success";
            cout << "[Admin] SUCCESS: Deleted Account " << id << endl;
        } else {
            res_json["status"] = "error";
            res_json["message"] = "رقم الحساب غير موجود!";
            cout << "[Admin] FAILED to delete Account " << id << " (Not Found)" << endl;
        }
        res.set_content(res_json.dump(), "application/json");
    });

    cout << "=========================================" << endl;
    cout << "   Banque Misr Server is Running..." << endl;
    cout << "   Port: 8080" << endl;
    cout << "=========================================" << endl;
    
    svr.listen("127.0.0.1", 8080);
    return 0;
}