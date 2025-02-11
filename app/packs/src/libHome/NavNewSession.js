import React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, FormControl, Glyphicon, Navbar, NavItem, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';

const NewSession = ({ authenticityToken, omniauthProviders }) => (
  <div>
    <Nav pullRight><NavItem href="/users/sign_up"> or Sign Up </NavItem></Nav>
    <Navbar.Form pullRight>
      <form id="new_user" className="new_user" action="/users/sign_in" acceptCharset="UTF-8" method="post" >
        <input name="utf8" value="✓" type="hidden" />
        <input name="authenticity_token" value={authenticityToken} type="hidden" />
        <OverlayTrigger placement="left" overlay={<Tooltip id="login_tooltip">Log in with email or name abbreviation(case-senstive)</Tooltip>}>
          <FormGroup>
            <FormControl id="user_login" type="text" placeholder="Email or name abbreviation" name="user[login]" />
          </FormGroup>
        </OverlayTrigger>
        <FormGroup>
          <FormControl id="user_password" type="password" name="user[password]" placeholder="password" />
        </FormGroup>
        <Button type="submit" bsStyle="primary">
          <Glyphicon glyph="log-in" />
        </Button>
      </form>
    </Navbar.Form>
    {
      omniauthProviders && omniauthProviders.includes('orcid') && <Nav pullRight>
        <NavItem href="/users/auth/orcid" className="omniauth-navitem">
          Login ORCID
        </NavItem>
      </Nav>
    }
    {
      omniauthProviders && omniauthProviders.includes('github') && <Nav pullRight>
        <NavItem href="/users/auth/github" className="omniauth-navitem">
          Login GitHub
        </NavItem>
      </Nav>
    }
    {
      omniauthProviders && omniauthProviders.includes('openid_connect') && <Nav pullRight>
        <NavItem href="/users/auth/openid_connect" className="omniauth-navitem">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Login OIDC
        </NavItem>
      </Nav>
    }
  </div>
);

NewSession.propTypes = {
  authenticityToken: PropTypes.string.isRequired
};

export default NewSession;
