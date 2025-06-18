# 🤝 Contributing to LiteJsonDB

First of all, thank you for considering contributing to LiteJsonDB! We welcome any help, whether it's reporting a bug, proposing a new feature, improving documentation, or submitting a pull request. Your involvement is what makes the open-source community such an amazing place.

To ensure the project remains stable, maintainable, and high-quality, we ask that you follow these simple guidelines.

### Guiding Principles

- **Clarity is King**: Write code that is easy to understand. Add comments where the logic is complex.
- **Test Everything**: Any new code should be accompanied by tests to prove it works and prevent future regressions.
- **Stay Focused**: Each pull request should address a single issue or feature. Avoid mixing bug fixes and new features in the same PR.

---

### How to Contribute

We have two main paths for contributions, depending on what you want to do: fixing a bug or proposing a new feature.

#### Path 1: Fixing a Bug 🐛

If you've found a bug in the existing code, you don't need to open an issue first. We trust you!

1.  **Fork the Repository**: Create your own copy of the project to work on.
2.  **Create a Bugfix Branch**: Name your branch descriptively.
    ```bash
    git checkout -b fix/name-of-the-bug
    ```
3.  **Write a Failing Test**: Before you fix anything, add a test to our test suite (`litejsondb-bug.test.js` or similar) that specifically reproduces the bug. Run the tests to confirm that your new test fails as expected. This proves the bug exists and ensures it won't come back.
    ```bash
    npm test 
    # See your new test fail!
    ```
4.  **Fix the Bug**: Now, dive into the code and implement the fix. Your goal is to make your failing test (and all other tests) pass.
    ```bash
    npm test
    # See all tests pass!
    ```
5.  **Document Your Changes**: In your Pull Request description, please be very clear about:
    *   **What the bug was**: "Calling `db.delete()` on a non-existent nested key was causing a crash because the parent object was undefined."
    *   **How you fixed it**: "I added a check to ensure the parent object exists before attempting to access its properties. I also added a test case for this specific scenario to prevent regressions."

6.  **Submit a Pull Request**: Push your branch to your fork and open a PR against the `main` branch of the original repository.

#### Path 2: Proposing a new feature ✨

If you have an idea for a new feature, a change to an existing one, or any enhancement, **please open an issue first**. This allows us to discuss the proposal and ensure it aligns with the project's goals before you spend time on implementation.

1.  **Open an Issue**: Go to the "Issues" tab and create a new issue. 
    *   **Title**: A clear and concise title, e.g., "Feature: Add a `db.clear()` method to empty the database".
    *   **Description**: Explain your idea in detail.
        *   **What is the problem you are trying to solve?** ("Currently, there is no easy way to delete all data without deleting the file itself.")
        *   **How do you propose to solve it?** ("I propose adding a `db.clear()` method that resets `db.db` to an empty object `{}` and schedules a save.")
        *   **Provide a code example** of how the new feature would be used by a developer.

2.  **Discussion**: We will discuss the feature with you in the issue thread. We might suggest changes or decide it's a good fit for the project.

3.  **Implementation (After Approval)**: Once the feature has been discussed and approved, you can follow the same technical steps as for a bug fix:
    *   Fork the repository and create a feature branch (`feat/your-feature`).
    *   Write the code for the new feature.
    *   Add comprehensive tests for all new functionality.
    *   Update the documentation (`README.md`) to include your new feature.
    *   Submit a Pull Request, linking it back to the original issue you created (e.g., "Closes #123").

---

Thank you again for your interest in making LiteJsonDB better. We look forward to your contributions