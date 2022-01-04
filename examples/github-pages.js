// https://github.com/maplibre/maplibre-gl-js/blob/ddf69421c6ae34c808afefec309a5beecdb7500e/src/index.ts#L151

// Since I had a custom domain set up on my github, I needed to add this "feature"
const customDomains = {
    'jimmyrocks': 'loc8.us'
};

window.arcgisTiles = (params, callback) => {
    const [user, repository, ...pathToFile] = params.url.split('://')[1].split('/');
    let domain = `${user}.github.io`;
    if (customDomains[user]) {
        domain = customDomains[user];
    }
    const newUrl = `https://${domain}/${repository}/${pathToFile.join('/')}`;

    fetch(newUrl)
        .then(response => {
            if (response.status == 200) {
                response.json().then(data => {
                    callback(null, data, null, null);
                });
            } else {
                callback(new Error(`Tile fetch error: ${response.statusText}`));
            }
        })
        .catch(e => {
            callback(new Error(e));
        });
    return { cancel: () => { } };
};
