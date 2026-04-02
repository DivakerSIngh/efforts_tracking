"""
Script to update all Firebase Authentication users with default passwords.
Password format: {emailPrefix}@1234
Example: ajay@talentonlease.com -> password: ajay@1234
"""

import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase app is already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize with service account key
        # Or use GOOGLE_APPLICATION_CREDENTIALS environment variable
        firebase_admin.initialize_app()
    
    print("✓ Firebase Admin SDK initialized")


def update_all_user_passwords():
    """
    Update all Firebase Auth users with default password format.
    Password = {email_prefix}@1234
    """
    
    updated_count = 0
    error_count = 0
    errors = []
    
    try:
        # Get all users from Firebase Auth
        page = auth.list_users()
        
        while page:
            for user in page.users:
                try:
                    # Extract email prefix (part before @)
                    email = user.email
                    if not email:
                        print(f"⚠ User {user.uid} has no email, skipping...")
                        continue
                    
                    # Extract prefix
                    email_prefix = email.split('@')[0]
                    new_password = f"{email_prefix}@1234"
                    
                    # Update password in Firebase Auth
                    auth.update_user(
                        user.uid,
                        password=new_password
                    )
                    
                    print(f"✓ Updated: {email} → Password: {new_password}")
                    updated_count += 1
                    
                except Exception as e:
                    error_count += 1
                    error_msg = f"✗ Failed to update {user.email}: {str(e)}"
                    print(error_msg)
                    errors.append(error_msg)
            
            # Get next page of users
            page = page.get_next_page()
        
        # Print summary
        print("\n" + "="*60)
        print(f"✓ Successfully updated: {updated_count} users")
        print(f"✗ Failed: {error_count} users")
        print("="*60)
        
        if errors:
            print("\nErrors:")
            for error in errors:
                print(f"  {error}")
        
        return updated_count, error_count
    
    except Exception as e:
        print(f"✗ Fatal error: {str(e)}")
        return 0, 0


def update_single_user(email: str):
    """
    Update a single user's password.
    """
    try:
        # Get user by email
        user = auth.get_user_by_email(email)
        
        # Extract prefix and create password
        email_prefix = email.split('@')[0]
        new_password = f"{email_prefix}@1234"
        
        # Update password
        auth.update_user(
            user.uid,
            password=new_password
        )
        
        print(f"✓ Updated: {email} → Password: {new_password}")
        return True
    
    except Exception as e:
        print(f"✗ Failed to update {email}: {str(e)}")
        return False


if __name__ == "__main__":
    print("Firebase Password Updater")
    print("="*60)
    
    # Initialize Firebase
    initialize_firebase()
    
    # Ask user what to do
    print("\nOptions:")
    print("1. Update ALL users with default passwords")
    print("2. Update a specific user")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        print("\nUpdating all users...")
        print("-"*60)
        update_all_user_passwords()
    
    elif choice == "2":
        email = input("Enter user email: ").strip()
        print(f"\nUpdating {email}...")
        print("-"*60)
        update_single_user(email)
    
    elif choice == "3":
        print("Exiting...")
    
    else:
        print("Invalid choice!")
