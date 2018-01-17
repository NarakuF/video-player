import React from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from './VideoPlayer';
import './index.css';

const videoJsOptions = {
    autoplay: true,
    controls: true,
    preload: 'auto',
    sources: [{ src: '//vjs.zencdn.net/v/oceans.mp4' }],
    width: '1200',
    height: '700',
};

ReactDOM.render(<VideoPlayer {...videoJsOptions} />, document.getElementById('root'));

//vjs.zencdn.net/v/oceans.mp4