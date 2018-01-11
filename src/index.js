import React from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from './VideoPlayer';
import './index.css';

const videoJsOptions = {
    autoplay: true,
    controls: true,
    sources: [{
        src: 'http://techslides.com/demos/samples/sample.mp4'
    }]
};

ReactDOM.render(<VideoPlayer {...videoJsOptions} />, document.getElementById('root'));

//vjs.zencdn.net/v/oceans.mp4