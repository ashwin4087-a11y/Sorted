import psycopg
from psycopg.errors import DuplicateDatabase

try:
    with psycopg.connect('postgresql://postgres:postgres@localhost:5432/postgres', autocommit=True) as conn:
        with conn.cursor() as cur:
            try:
                cur.execute('CREATE ROLE sorted WITH LOGIN PASSWORD ''YourNewPassword123!'';')
                print('Created role sorted')
            except Exception as e:
                print('Role may already exist:', e)
            try:
                cur.execute('CREATE DATABASE sorted OWNER sorted;')
                print('Created database sorted')
            except DuplicateDatabase:
                print('Database sorted already exists')
            except Exception as e:
                print('Failed to create DB:', e)
except Exception as e:
    print('Connection to postgres failed:', e)
