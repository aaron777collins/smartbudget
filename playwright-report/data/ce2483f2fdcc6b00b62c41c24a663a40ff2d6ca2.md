# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Sign in
      - generic [ref=e7]: Enter your username and password to sign in to your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Username
          - textbox "Username" [ref=e11]:
            - /placeholder: Enter your username
        - generic [ref=e12]:
          - text: Password
          - textbox "Password" [ref=e13]:
            - /placeholder: Enter your password
      - generic [ref=e14]:
        - button "Sign in" [ref=e15] [cursor=pointer]
        - paragraph [ref=e16]:
          - text: Don't have an account?
          - link "Sign up" [ref=e17] [cursor=pointer]:
            - /url: /auth/signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e28]
```