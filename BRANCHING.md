# 🌿 PropOwl Branching Strategy & Workflow

## 📋 **Branch Structure**

```
feature/fix branches → staging (default) → main (production)
                        ↓                    ↓
                   staging.propowl.ai    propowl.ai
```

### **Branch Purposes:**
- **`staging`** (default): Integration branch, auto-deploys to staging.propowl.ai
- **`main`** (production): Production-ready code, deploys to propowl.ai

## 🛡️ **Branch Protection Rules**

### **Staging Branch Protection:**
- ✅ **Requires Pull Request** - No direct pushes allowed
- ✅ **Requires 1 Approval** - Someone must review and approve
- ✅ **No Force Push** - Prevents accidental overwrites
- ✅ **No Deletion** - Branch cannot be deleted
- ✅ **Admin Enforcement** - Even admins must follow rules

### **Main Branch Protection:**
- ✅ **Requires Pull Request** - No direct pushes allowed
- ✅ **Requires 1 Approval** - Someone must review and approve
- ✅ **Dismiss Stale Reviews** - Re-approval needed after new commits
- ✅ **No Force Push** - Prevents accidental overwrites
- ✅ **No Deletion** - Branch cannot be deleted
- ✅ **Admin Enforcement** - Even admins must follow rules

## 🚀 **Development Workflow**

### **1. Feature Development**
```bash
# Start from latest staging
git checkout staging
git pull origin staging

# Create feature branch
git checkout -b feature/your-feature-name

# Develop and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR to staging
git push origin feature/your-feature-name
gh pr create --base staging --head feature/your-feature-name
```

### **2. Staging Deployment**
1. **Create PR** to `staging` branch
2. **Get Review & Approval** (required by branch protection)
3. **Merge PR** → Auto-deploys to staging.propowl.ai
4. **Test on Staging** - Verify everything works
5. **Delete Feature Branch** after successful merge

### **3. Production Deployment**
1. **Test Thoroughly** on staging.propowl.ai
2. **Create PR** from `staging` → `main`
3. **Get Review & Approval** (required by branch protection)
4. **Merge PR** → Auto-deploys to propowl.ai
5. **Monitor Production** - Watch for issues

## ⚠️ **Critical Rules - NO EXCEPTIONS**

### **🚫 NEVER:**
- Push directly to `staging` or `main` branches
- Bypass PR requirements (impossible due to branch protection)
- Force push to protected branches (blocked by GitHub)
- Deploy to production without testing on staging
- Merge PRs without proper review and approval

### **✅ ALWAYS:**
- Create feature branches from latest `staging`
- Submit PRs for all changes
- Get at least 1 approval before merging
- Test changes on staging.propowl.ai before production
- Use descriptive branch names and commit messages

## 📝 **PR Templates**

**For PRs to Staging:**
- Use `.github/pull_request_template/staging.md`
- Focuses on feature testing and functionality

**For PRs to Production:**
- Use `.github/pull_request_template/production.md`
- Extra safety checks and deployment verification

## 🔥 **Emergency Hotfixes**

For critical production issues:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Fix the issue
git add .
git commit -m "hotfix: critical issue description"

# Deploy to staging first for testing
git push origin hotfix/critical-issue
gh pr create --base staging --title "HOTFIX: Critical Issue"

# After staging verification, deploy to production
gh pr create --base main --title "HOTFIX: Critical Issue (PRODUCTION)"
```

## 🎯 **Quality Gates**

### **Before Merging to Staging:**
- [ ] Code compiles without errors
- [ ] ESLint passes
- [ ] TypeScript checks pass
- [ ] Feature works as expected
- [ ] No breaking changes

### **Before Merging to Production:**
- [ ] All staging tests pass
- [ ] Manual testing completed on staging.propowl.ai
- [ ] No critical bugs found
- [ ] Database migrations ready (if any)
- [ ] Deployment plan documented

## 🏆 **Benefits of This Workflow**

- **🛡️ Bulletproof**: No way to accidentally break production
- **🧪 Safe Testing**: Always test on staging first
- **👥 Code Review**: All changes are reviewed by another person
- **📊 History**: Clear git history of what was deployed when
- **🚀 Confidence**: Deploy to production with confidence
- **🔄 Rollback**: Easy to rollback if issues occur

---

**Questions? Check with the team or refer to GitHub's branch protection documentation.**