# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.base.models.company import Company
from flask import render_template, redirect, request, url_for, current_app, jsonify
from flask_login import (
    current_user,
    login_user,
    logout_user
)
import jwt
import os
from datetime import datetime, timedelta

from apps import db, login_manager
from apps.authentication import blueprint
from apps.authentication.forms import LoginForm, CreateAccountForm

from apps.authentication.util import verify_pass

from apps.authentication.models import Users
from flasgger.utils import swag_from


def generate_hasura_jwt(user):
    """Generate a JWT token with Hasura claims"""
    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-min-32-chars')

    # Define allowed roles based on user role
    if user.role == 'admin':
        allowed_roles = ['admin', 'user', 'anonymous']
        default_role = 'admin'
    else:
        allowed_roles = ['user', 'anonymous']
        default_role = 'user'

    payload = {
        'sub': str(user.id),
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=24),
        'https://hasura.io/jwt/claims': {
            'x-hasura-allowed-roles': allowed_roles,
            'x-hasura-default-role': default_role,
            'x-hasura-user-id': str(user.id),
            'x-hasura-company-id': str(user.company_id) if user.company_id else '0'
        }
    }

    return jwt.encode(payload, jwt_secret, algorithm='HS256')


@blueprint.route('/')
def route_default():
    return redirect(url_for('authentication_blueprint.login'))


# Login & Registration

@blueprint.route('/login', methods=['GET', 'POST'])
@swag_from('swagger/login_specs.yml', methods=['GET'])
@swag_from('swagger/login_specs.yml', methods=['POST'])
def login():
    login_form = LoginForm(request.form)

    if 'login' in request.form:

        
        username = request.form['username']
        password = request.form['password']

       
        user = Users.query.filter_by(username=username).first()

        
        if user and verify_pass(password, user.password):

            login_user(user)
            return redirect('/apidocs')

        
        return render_template('accounts/login.html',
                               msg='Mauvais pseudo ou mot de passe',
                               form=login_form)

    logout_user()
    return render_template('accounts/login.html',
                               form=login_form)


@blueprint.route('/register', methods=['GET', 'POST'])
def register():
    create_account_form = CreateAccountForm(request.form)
    if 'register' in request.form:

        form_data = request.form.copy()

        username = request.form['username']
        email = request.form['email']
        company_id = int(request.form['company']) if request.form['company'] else None
        form_data['company_id'] = company_id
        form_data.pop('company', None)

        
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Pseudo déjà utilisé',
                                   success=False,
                                   form=create_account_form)

        
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Adresse mail déjà utilisée',
                                   success=False,
                                   form=create_account_form)

        
        user = Users(**form_data)
        db.session.add(user)
        db.session.commit()

        return render_template('accounts/register.html',
                               msg='Utilisateur créé, <a href="/login">se connecter</a>',
                               success=True,
                               form=create_account_form)

    else:
        companies = Company.query.all()
        create_account_form.company.choices = [('', 'Select a company...')] + [(str(company.id), company.name) for company in companies]
        return render_template('accounts/register.html', form=create_account_form)


@blueprint.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('authentication_blueprint.login'))


@blueprint.route('/api/auth/login', methods=['POST'])
@swag_from('swagger/api_login_specs.yml', methods=['POST'])
def api_login():
    """API endpoint for login that returns a JWT token with Hasura claims"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    user = Users.query.filter_by(username=username).first()

    if user and verify_pass(password, user.password):
        token = generate_hasura_jwt(user)
        return jsonify({
            'token': token,
            'user': user.serialize
        })

    return jsonify({'error': 'Invalid credentials'}), 401


# Errors

@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('home/page-403.html'), 403


@blueprint.errorhandler(403)
def access_forbidden(error):
    return render_template('home/page-403.html'), 403


@blueprint.errorhandler(404)
def not_found_error(error):
    return render_template('home/page-404.html'), 404


@blueprint.errorhandler(500)
def internal_error(error):
    return render_template('home/page-500.html'), 500
