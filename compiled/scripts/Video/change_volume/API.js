import * as Router from '../../Router/main.js';
import { Process } from '../../Process/main.js';
import { createQueueItem, generateToken } from '../../Queue/main.js';
Router.post('/api/change_volume', (req, res) => {
    // if(!canDoApiRequest(req)) {
    //     res.status(404).json({
    //         message: 'Too many requests'
    //     })
    // }
    let file = req.body.file?.replaceAll('\\', '/').split('/').pop();
    if (!file || typeof file != 'string') {
        return res.status(400).send(`Invalid request body`);
    }
    let token = createQueueItem({
        action: 'video / change_volume',
        next: 'video',
    });
    res.status(200).json({
        token: token
    });
    let outFile = generateToken();
    let process = new Process('change_volume', token, ['public\\temp', file, outFile + '.mp4', req.body.volume]);
});
