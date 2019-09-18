import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button } from '@patternfly/react-core';
import cookie from 'js-cookie';
import "../../../sass/beta.scss"

const Beta = () => {
    if (window.location.href.includes('/beta')) {
        return (
            <div className={'ins-c-page__beta '}>
                <i className='fas fa-flask'></i>
                <Tooltip
                    content={
                        <div>This is a beta environment and contains Technology Preview
                        features that are not supported by Red Hat production service-level
                        agreements (SLAs) and might not be functionally complete. Red Hat
                        recommends not using them for production.</div>
                    }
                >
                    <p>Insights & Cloud Management Services Beta.</p>
                </Tooltip>
                <p><a onClick={ goToStable }> Take me to Stable</a>.</p>
                {cookie.get('betaDefault') ? null :
                    <Button
                        variant="primary" 
                        id="beta_button"
                        onClick={ setBetaDefault }>
                        Set as Default
                    </Button> 
                }
            </div>
        )
    } else {
        return null
    }
};

Beta.propTypes = {
    betaHidden: PropTypes.bool
};

function goToStable() {
    cookie.remove('betaDefault');
    window.location = window.location.href.replace('/beta', '');
}

function setBetaDefault() {
    cookie.set('betaDefault', true, { expires: 9999 });
    document.getElementById('beta_button').className += ' ins-c-button_hidden';
}

//export default Beta;
export default Beta;
