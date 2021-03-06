// The p5.js functionality for the left panel

var viewL_updated = true;

let viewL = function(p) {

    /*p.preload = function() {
    	p.bgImage = p.loadImage('assets/svs005axial_568.PNG');		
    }*/

    p.setup = function() {
        var w = parseInt($("#grid_viewL").attr("data-sizex")) * (($(".gridster").width() - gridster_api.options.widget_margins[0]) / 35 + 0.5);
        var h = parseInt($("#grid_viewL").attr("data-sizey")) * (($(".gridster").height() - gridster_api.options.widget_margins[1]) / 17 - 3);
        //var h = parseInt($("#grid_viewL").attr("data-sizey")) * gridster_api.options.widget_base_dimensions[1]; 
        p.createCanvas(w, h);

        p.textAlign(p.CENTER, p.CENTER);
        //p.rectMode(p.CORNERS);

        p.voxelMargin = { left: Math.round(w * 0.35), top: Math.round(h / 15), right: Math.round(w / 15), bottom: Math.round(h / 2) };
        p.spectrumMargin = { left: Math.round(w / 15), top: Math.round(h * 0.66), right: Math.round(w / 15), bottom: Math.round(h / 25) };
        p.canvas_size = [p.width - p.voxelMargin.right - p.voxelMargin.left, p.height - p.voxelMargin.bottom - p.voxelMargin.top];

        p.message = "Data not loaded";
        p.error_state = false;      // is an error message displayed?

        // selected dataopint
        p.chosen_patient = 0;
        p.chosen_timepoint = 0;
        p.chosen_state = 0;
        p.chosen_voxel = 0;
        p.mousover_voxel = -1;

        // axis positions
        p.x_axis_pos = p.height - p.voxelMargin.bottom * 0.93; // y-coordinate of X axis
        p.y_axis_pos = p.voxelMargin.left * 0.85; // x-coordinate of Y axis

        // distance of +- buttons from the point on Y axis
        p.plus_btn_dist = 47;
        p.minus_btn_dist = 30;

        // positions of data points on axes
        p.y_point_positions = [];
        p.x_point_positions = [];

        // mouse over positions on axis / patient selector
        p.active_voxel = -1;
        p.active_voxel_add = -1;
        p.active_voxel_remove = -1;
        p.active_patient = -1;
        p.active_timepoint = -1;
        p.active_state = -1;

        // patient, time and state of the current image of is displayed (needed because of flipping on focus in the right view)
        p.displayed_patient = 0;
        p.displayed_timepoint = 0;
        p.displayed_state = 0;
        p.displayed_voxel = 0;

        //	voxels to be displayed in the spectral graph
        p.selected_spectra = [];

        //p.bgImage = p.resizeImage(p.bgImage, p.canvas_size[0], p.canvas_size[1]);
    };

    p.draw = function() {
        p.updateScene();
        p.noLoop();
    };

    p.resized = function() {
        var w = parseInt($("#grid_viewL").attr("data-sizex")) * (($(".gridster").width() - gridster_api.options.widget_margins[0]) / 35 + 0.5);
        var h = parseInt($("#grid_viewL").attr("data-sizey")) * (($(".gridster").height() - gridster_api.options.widget_margins[1]) / 17 - 3);
        p.resizeCanvas(w, h);

        p.voxelMargin = { left: Math.round(w * 0.35), top: Math.round(h / 15), right: Math.round(w / 15), bottom: Math.round(h / 2) };
        p.spectrumMargin = { left: Math.round(w / 15), top: Math.round(h * 0.66), right: Math.round(w / 15), bottom: Math.round(h / 25) };
        p.canvas_size = [p.width - p.voxelMargin.right - p.voxelMargin.left, p.height - p.voxelMargin.bottom - p.voxelMargin.top];

        // axis positions
        p.x_axis_pos = p.height - p.voxelMargin.bottom * 0.93;
        p.y_axis_pos = p.voxelMargin.left * 0.85;

        p.updateScene();
    }

    p.updateScene = function() {
        p.background(255);

        // draw the border of the window
        p.strokeWeight(1);
        p.stroke(200);
        p.noFill();
        p.rect(0, 0, p.width - 2, p.height - 2, 10);

        if (p.message != "") {
            p.fill(0);
            p.noStroke();
            p.textFont("Arial", 14);
            p.text(p.message, p.width / 2, p.height / 2);
        } else {
            p.highlightVoxels();
            p.drawLines();
            p.drawVoxelPosition();
            p.drawSpectra();
        }
    }

    p.setMessage = function(msg) {
        p.message = msg;
        p.updateScene();
    }

    p.displayError = function(err_msg) {
        if (p.error_state) return;
        
        p.error_state = true;

        var original_msg = p.message;
        p.message = err_msg;
        p.updateScene();

        setTimeout(() => {
            p.message = original_msg;
            p.error_state = false;
            p.updateScene();
        }, 3000);
    }

    p.drawLines = function() {

        // patient selector

        p.fill(0);
        p.noStroke();
        p.textFont("Arial", 14);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("Patient ID", 10, p.voxelMargin.top * 0.8);

        var selector_start = p.voxelMargin.top * 0.8 + 20;

        for (var i = 0; i < app.patient_data.length; i++) {

            // highlight by grey box
            if (app.patient_data[i].highlighted || i == p.displayed_patient) {
                p.noStroke();
                p.fill(150, 100);

                var textW = p.textWidth(app.patient_data[i].name);

                p.rect(12, selector_start + i * 20 - 9, p.max(75, textW + 30), 18);
            }

            p.fill(255);

            p.stroke(0);
            p.ellipse(20, selector_start + i * 20, 10, 10);

            p.noStroke();
            p.fill(0);
            p.text(app.patient_data[i].name, 40, selector_start + i * 20);
        }

        p.textAlign(p.CENTER, p.CENTER);


        // time selector

        p.stroke(0)
        p.strokeWeight(1.5);
        p.line(p.voxelMargin.left, p.x_axis_pos, p.width - p.voxelMargin.right, p.x_axis_pos);

        var line_length = p.width - p.voxelMargin.right - p.voxelMargin.left;
        var point_dist = line_length / (2 * app.patient_data[p.displayed_patient].timepoints.length);

        p.x_point_positions = [];

        for (var i = 0; i < app.patient_data[p.displayed_patient].timepoints.length; i++) {
            var x_pos = p.map(i, 0, app.patient_data[p.displayed_patient].timepoints.length, 0, line_length);
            x_pos += point_dist;

            p.x_point_positions.push({ x: x_pos, states: [] });

            p.stroke(0)
            p.strokeWeight(1.5);
            p.line(p.voxelMargin.left + x_pos, p.x_axis_pos - 15, p.voxelMargin.left + x_pos, p.x_axis_pos + 15);

            for (var s = 0; s < app.patient_data[p.displayed_patient].timepoints[i].states.length; s++) {

                p.x_point_positions[p.x_point_positions.length - 1].states.push(app.patient_data[p.displayed_patient].timepoints[i].states[s].state);

                var x_shift;

                if (app.patient_data[p.displayed_patient].timepoints[i].states.length == 2) {
                    if (app.patient_data[p.displayed_patient].timepoints[i].states[s].state == 0) {
                        x_shift = -15;
                    } else {
                        x_shift = 0;
                    }
                } else {
                    x_shift = -7.5;
                }

                if ((i == p.displayed_timepoint && app.patient_data[p.displayed_patient].timepoints[i].states[s].state == p.displayed_state) || app.patient_data[p.displayed_patient].timepoints[i].states[s].highlighted) {
                    p.noStroke();
                    p.fill(150, 100);
                    p.rect(p.voxelMargin.left + x_pos + x_shift - 5, p.x_axis_pos - 25, 25, 50);
                }

                if (app.patient_data[p.displayed_patient].timepoints[i].states[s].state == 0) {
                    p.fill(255);
                } else {
                    p.fill(0);
                }

                p.stroke(0);

                //p.ellipse(p.voxelMargin.left + x_pos + x_shift, p.height - p.voxelMargin.bottom * 0.5 , 20, 20);
                p.rect(p.voxelMargin.left + x_pos + x_shift, p.x_axis_pos - 7.5, 15, 15);
            }
        }

        p.fill(0);
        p.noStroke();
        p.textFont("Arial", 16);
        p.text("Acquisition time", (p.voxelMargin.left + p.width - p.voxelMargin.right) / 2, p.x_axis_pos + 35);

        // voxel selector	

        p.textFont("Arial", 16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Position", p.y_axis_pos, p.voxelMargin.top * 0.8);

        p.stroke(0)
        p.strokeWeight(1.5);
        p.line(p.y_axis_pos, p.voxelMargin.top, p.y_axis_pos, p.height - p.voxelMargin.bottom);

        var voxel_count = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels.length;

        p.y_point_positions = [];
        line_length = p.height - p.voxelMargin.bottom - p.voxelMargin.top;
        point_dist = line_length / (2 * voxel_count);

        for (var i = 0; i < voxel_count; i++) {
            var y_pos = p.map(i, 0, voxel_count, 0, line_length);
            y_pos += point_dist;

            p.y_point_positions.push(y_pos);

            p.stroke(0);

            //p.line(p.y_axis_pos - p.plus_btn_dist, p.voxelMargin.top + y_pos, p.y_axis_pos + 20, p.voxelMargin.top + y_pos);

            if (i == p.displayed_voxel || app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[i].highlighted) {
                p.noStroke();
                p.fill(150, 100);
                p.rect(p.y_axis_pos - 25, p.voxelMargin.top + y_pos - 15, 50, 30);
            }

            /*if (app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[i].highlighted) p.fill(255, 0, 255);
            else */
            p.fill(255);

            p.stroke(0);


            p.ellipse(p.y_axis_pos, p.voxelMargin.top + y_pos, 20, 20); //draw circle to identify spatial position voxels for given patient

            p.textFont("Arial", 13);
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(0);
            p.noStroke();

        }

    }

    p.drawVoxelPosition = function() {

        p.rectMode(p.CORNERS);
        p.fill(0);
        p.rect(p.voxelMargin.left, p.voxelMargin.top, p.width - p.voxelMargin.right, p.height - p.voxelMargin.bottom);
        p.rectMode(p.CORNER);

        var img, img_info;

        //displayed MR image based on voxel that is active 
        if (p.active_voxel == -1) {
            img = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[p.displayed_voxel].loc_image;

            img_info = p.composeInfoString(p.displayed_patient, p.displayed_timepoint, p.displayed_state, p.displayed_voxel);
        } else {
            if (p.active_patient == -1) { // active voxel -> mouse action on left view
                img = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[p.active_voxel].loc_image; // show a different image on mousover
                img_info = p.composeInfoString(p.displayed_patient, p.displayed_timepoint, p.displayed_state, p.active_voxel);

            }
        }

        var axisLenY = p.height - p.voxelMargin.bottom - p.voxelMargin.top;
        var axisLenX = p.width - p.voxelMargin.left - p.voxelMargin.right;
        var s = Math.min(axisLenX, axisLenY);

        var scale_factor = s / img.height;

        p.imageMode(p.CENTER);

        p.image(img, (p.voxelMargin.left + p.width - p.voxelMargin.right) / 2, (p.voxelMargin.top + p.height - p.voxelMargin.bottom) / 2, img.width * scale_factor, img.height * scale_factor);

        p.fill(0);
        p.noStroke();
        p.textFont("Arial", 14);
        p.textAlign(p.CENTER);

        p.text("Voxel info: " + img_info, (p.voxelMargin.left + p.width - p.voxelMargin.right) / 2 - (p.width - p.voxelMargin.right - p.voxelMargin.left) / 2,
            p.height - p.voxelMargin.bottom * 0.83,
            p.width - p.voxelMargin.right - p.voxelMargin.left,
            50);
    }

    p.composeInfoString = function(patient_idx, time_idx, state_idx, voxel_idx) {
        var info_string = "Patient " + app.patient_data[patient_idx].name + ", " + app.patient_data[patient_idx].timepoints[time_idx].time + ", ";
        if (app.patient_data[patient_idx].timepoints[time_idx].states[state_idx].state == 0) {
            info_string += "resting, ";
        } else if (app.patient_data[patient_idx].timepoints[time_idx].states[state_idx].state == 1) {
            info_string += "active, ";
        }

        info_string += app.patient_data[patient_idx].timepoints[time_idx].states[state_idx].voxels[voxel_idx].id + " (" +
            app.patient_data[patient_idx].timepoints[time_idx].states[state_idx].voxels[voxel_idx].location + "), TE: " +
            app.patient_data[patient_idx].timepoints[time_idx].states[state_idx].voxels[voxel_idx].echotime;

        return info_string;
    }

    p.drawSpectra = function() {
        // PPM values on axis
        var scale_vector = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[p.displayed_voxel].data["PPMScale"];

        //boundaries of x scale from data 
        var axis_from = scale_vector[0];
        var axis_to = scale_vector[scale_vector.length - 1];

        // draw axis line and text //
        // axis title
        p.fill(0);
        p.noStroke();
        p.textFont("Arial", 16);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("Spectral Graph", p.spectrumMargin.left, p.spectrumMargin.top);

        // chemical shift x axis line
        p.stroke(0);
        p.line(p.spectrumMargin.left, p.height - p.spectrumMargin.bottom, p.width - p.spectrumMargin.right, p.height - p.spectrumMargin.bottom);

        // chemical shift x axis tick marks
        for (var i = 0; i < p.width - 2 * p.spectrumMargin.right; i += 10) {
            p.line(p.spectrumMargin.left + i, p.height - p.spectrumMargin.bottom, p.spectrumMargin.left + i, p.height - p.spectrumMargin.bottom - 5) //x1 y1 x2 y2
        }

        // x axis label and values  
        p.fill(0);
        p.noStroke();
        p.textFont("Arial", 12);
        p.textAlign(p.LEFT, p.CENTER);

        //axis numbers -- TODO make this nicer, add numbers evenly arranged in between these endpoints
        p.text(Math.ceil(axis_from), p.spectrumMargin.left - 7, p.spectrumMargin.top + 265);
        p.text(Math.floor(axis_to), p.width - p.spectrumMargin.right, p.spectrumMargin.top + 265);

        //axis label
        p.textFont("Arial", 14);
        p.text("Chemical Shift (ppm)", p.width / 2 - p.spectrumMargin.left - p.spectrumMargin.right, p.spectrumMargin.top + 280);


        var y_base = p.height - p.spectrumMargin.bottom - 15;
        var max_height = p.height - p.spectrumMargin.top - p.spectrumMargin.bottom - 50;
        var line_length = p.width - p.spectrumMargin.left - p.spectrumMargin.right;

        var displayed_spectra = [];

        if (selected_voxels.length > 0) {
            // instead of sorting: push the highlighted first, the rest after
            selected_voxels.forEach(function(elem) {
                if (elem.highlighted) displayed_spectra.push({ data: elem.values_disp["Data"], highlighted: true });
            });
            selected_voxels.forEach(function(elem) {
                if (!elem.highlighted) displayed_spectra.push({ data: elem.values_disp["Data"], highlighted: false });
            });

        } else if (p.active_voxel != -1) {
            displayed_spectra.push({ data: app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[p.active_voxel].displayed_data["Data"], highlighted: false });
        } else {
            displayed_spectra.push({ data: app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[p.displayed_voxel].displayed_data["Data"], highlighted: false });
        }


        // draw in reverse order so that the highlighted spectra are on top
        for (var i = displayed_spectra.length - 1; i >= 0; i--) {
            var x_position = 0;

            var drawn_data = resizeArray(displayed_spectra[i].data, line_length);

            if (displayed_spectra[i].highlighted) {
                p.stroke(255, 0, 255);
                p.strokeWeight(1.5);
            } else {
                p.stroke(0);
                p.strokeWeight(1);
            }

            p.noFill();

            p.beginShape();

            for (var x = 0; x < drawn_data.length; x++) {
                var val_mapped = p.map(drawn_data[x], 0, 1, 0, max_height);
                p.vertex(p.spectrumMargin.left + x_position, y_base - val_mapped);
                x_position++;
            }
            p.endShape();
        }

        
    }

    p.highlightVoxels = function() {

        // reset all highlights
        app.patient_data.forEach(function(patient) {
            patient.timepoints.forEach(function(timepoint) {
                timepoint.states.forEach(function(state) {
                    state.voxels.forEach(function(voxel) {
                        voxel.highlighted = false;
                    });
                    state.highlighted = false;
                });
                timepoint.highlighted = false;
            });
            patient.highlighted = false;
        });

        if (ids_to_highlight.length == 0) {
            p.displayed_patient = p.chosen_patient;
            p.displayed_timepoint = p.chosen_timepoint;
            p.displayed_state = p.chosen_state;
            p.displayed_voxel = p.chosen_voxel;

            return;
        }

        //var displayed_pt_idx, displayed_state_idx, displayed_vox_idx, displayed_time_idx;

        var displayed_pt_idx = ids_to_highlight.findIndex(function(id) {
            return id.split("_")[1] === app.patient_data[p.chosen_patient].name;
        });

        // determine what patient to draw selectors from
        if (displayed_pt_idx != -1) {
            p.displayed_patient = p.chosen_patient;

            var displayed_time_idx = ids_to_highlight.findIndex(function(id) {
                return id.split("_")[3] === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].time &&
                    id.split("_")[1] === app.patient_data[p.chosen_patient].name;
            });

            if (displayed_time_idx != -1) {
                p.displayed_timepoint = p.chosen_timepoint;

                var displayed_state_idx = ids_to_highlight.findIndex(function(id) {
                    return parseInt(id.split("_")[2]) === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.chosen_state].state &&
                        id.split("_")[3] === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].time &&
                        id.split("_")[1] === app.patient_data[p.chosen_patient].name;
                });


                if (displayed_state_idx != -1) {
                    p.displayed_state = p.chosen_state;

                    var displayed_vox_idx = ids_to_highlight.findIndex(function(id) {
                        return id.split("_")[4] === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.chosen_state].voxels[p.chosen_voxel].vox_id &&
                            parseInt(id.split("_")[2]) === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.chosen_state].state &&
                            id.split("_")[3] === app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].time &&
                            id.split("_")[1] === app.patient_data[p.chosen_patient].name;
                    });

                    if (displayed_vox_idx != -1) {
                        p.displayed_voxel = p.chosen_voxel
                    } else {
                        p.displayed_voxel = app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.chosen_state].voxels.findIndex(function(voxel) {
                            return voxel.id === ids_to_highlight[displayed_state_idx].split("_")[4];
                        });
                    }

                } else {

                    p.displayed_state = app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states.findIndex(function(s) {
                        return s.state === parseInt(ids_to_highlight[displayed_time_idx].split("_")[2]);
                    });

                    p.displayed_voxel = app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.displayed_state].voxels.findIndex(function(voxel) {
                        return voxel.id === ids_to_highlight[displayed_time_idx].split("_")[4];
                    });

                    /*displayed_state_idx = displayed_time_idx;
                    displayed_vox_idx = displayed_time_idx;*/
                }
            } else {

                p.displayed_timepoint = app.patient_data[p.chosen_patient].timepoints.findIndex(function(timepoint) {
                    return timepoint.time === ids_to_highlight[displayed_pt_idx].split("_")[3];
                });

                p.displayed_state = app.patient_data[p.chosen_patient].timepoints[p.displayed_timepoint].states.findIndex(function(s) {
                    return s.state === parseInt(ids_to_highlight[displayed_pt_idx].split("_")[2]);
                });

                p.displayed_voxel = app.patient_data[p.chosen_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels.findIndex(function(voxel) {
                    return voxel.id === ids_to_highlight[displayed_pt_idx].split("_")[4];
                });

                /*displayed_time_idx = displayed_pt_idx;
                displayed_state_idx = displayed_pt_idx;
                displayed_vox_idx = displayed_pt_idx;*/
            }

        } else {
            p.displayed_patient = app.patient_data.findIndex(function(patient) {
                return patient.name === ids_to_highlight[0].split("_")[1];
            });

            p.displayed_timepoint = app.patient_data[p.displayed_patient].timepoints.findIndex(function(timepoint) {
                return timepoint.time === ids_to_highlight[0].split("_")[3];
            });

            p.displayed_state = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states.findIndex(function(s) {
                return s.state === parseInt(ids_to_highlight[0].split("_")[2]);
            });

            p.displayed_voxel = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels.findIndex(function(voxel) {
                return voxel.id === ids_to_highlight[0].split("_")[4];
            });

            /*displayed_pt_idx = 0;
            displayed_time_idx = 0;
            displayed_state_idx = 0;
            displayed_vox_idx = 0;*/
        }


        ids_to_highlight.forEach(function(id_highlighted) {
            var voxel_loc = id_highlighted.split("_")[0];
            var patient = id_highlighted.split("_")[1];
            var state = id_highlighted.split("_")[2];
            var time = id_highlighted.split("_")[3];
            var vox_id = id_highlighted.split("_")[4];

            if (patient != app.patient_data[p.displayed_patient].name) {
                var patient_idx = app.patient_data.findIndex(function(element) {
                    return element.name == patient;
                });

                app.patient_data[patient_idx].highlighted = true;


            } else if (time != app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].time ||
                parseInt(state) != app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].state) {

                var time_idx = app.patient_data[p.displayed_patient].timepoints.findIndex(function(element) {
                    return element.time == time;
                });

                if (app.patient_data[p.displayed_patient].timepoints[time_idx].states.length == 1) {
                    app.patient_data[p.displayed_patient].timepoints[time_idx].states[0].highlighted = true;

                } else {
                    var state_idx = app.patient_data[p.displayed_patient].timepoints[time_idx].states.findIndex(function(element) {
                        return element.state == parseInt(state);
                    });


                    app.patient_data[p.displayed_patient].timepoints[time_idx].states[state_idx].highlighted = true;
                }
            } else {
                var datapoints_array = app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels;


                var datapoint_idx = datapoints_array.findIndex(function(elem) {
                    return elem.id == vox_id;
                });

                app.patient_data[p.displayed_patient].timepoints[p.displayed_timepoint].states[p.displayed_state].voxels[datapoint_idx].highlighted = true;
            }
        });
    }

    p.mouseMoved = function() {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return; // skip all mouse events when outside of the window
        if (app.patient_data.length == 0) return;

        p.updateScene();
        p.active_voxel = -1;
        p.active_voxel_add = -1;
        p.active_voxel_remove = -1;
        p.active_patient = -1;
        p.active_timepoint = -1;
        p.active_state = -1;

        if (p.abs(p.mouseX - 20) < 75) { // check mouse over patient selector
            for (var i = 0; i < app.patient_data.length; i++) {
                if (p.abs(p.mouseY - (p.voxelMargin.top + 10 + i * 20)) < 7.5) {
                    p.cursor(p.HAND);
                    p.active_patient = i;
                    break;
                } else {
                    p.cursor(p.ARROW);
                }
            }

        } else if (p.abs(p.mouseX - p.y_axis_pos) < 20) { // check mouse over Y axis

            var voxel_count = app.patient_data[p.chosen_patient].timepoints[p.chosen_timepoint].states[p.chosen_state].voxels.length;
            for (var i = 0; i < voxel_count; i++) {
                if (p.abs(p.voxelMargin.top + p.y_point_positions[i] - p.mouseY) < 20) {
                    p.cursor(p.HAND);

                    p.active_voxel_remove = i;
                    p.active_voxel = i;

                    // tooltip not needed, replaced with a heading

                    break;
                } else {
                    p.cursor(p.ARROW);
                }
            }

        } else { // check mouse over X axis

            var found_timepoint = false;

            for (var i = 0; i < p.x_point_positions.length; i++) {
                for (var s = 0; s < p.x_point_positions[i].states.length; s++) {

                    var x_shift;

                    if (p.x_point_positions[i].states.length == 2) {
                        if (p.x_point_positions[i].states[s] == 0) {
                            x_shift = -7.5;
                        } else {
                            x_shift = 7.5;
                        }
                    } else {
                        x_shift = 0;
                    }

                    if (p.abs(p.voxelMargin.left + p.x_point_positions[i].x + x_shift - p.mouseX) < 7.5 && p.abs(p.mouseY - p.x_axis_pos) < 7.5) {

                        p.cursor(p.HAND);

                        p.fill(0);
                        p.noStroke();
                        p.textFont("Arial", 12);

                        var tooltip_text = app.patient_data[p.chosen_patient].timepoints[i].time;
                        if (p.x_point_positions[i].states[s] == 0) {
                            tooltip_text += ": resting";
                        } else {
                            tooltip_text += ": active";
                        }
                        p.text(tooltip_text, p.mouseX, p.mouseY + 30);

                        p.active_timepoint = i;
                        p.active_state = s;
                        var found_timepoint = true;
                        break;
                    } else {
                        p.cursor(p.ARROW);
                    }
                }
                if (found_timepoint) break;
            }
        }

    }

    p.mouseClicked = function() {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return; // skip all mouse events when outside of the window

        if (p.active_patient != -1) {
            p.chosen_patient = p.active_patient;
            p.chosen_timepoint = 0;
            p.chosen_state = 0;
            p.chosen_voxel = 0;

        } else if (p.active_timepoint != -1) {
            p.chosen_timepoint = p.active_timepoint;
            p.chosen_state = p.active_state;
            p.chosen_voxel = 0;

        } else if (p.active_voxel != -1) { // add and remove need to have higher priority
            p.chosen_voxel = p.active_voxel;
        }

        p.updateScene();
    }

};

// switching between panels: spatial view and voxel group creation panel

$("#selection-tab-btn").on('click', function(evt) {
    //disable this button
    $("#selection-tab-btn").addClass("disabled");

    // enable the other button
    $("#spatial-tab-btn").removeClass("disabled");

    // flip view
    $("#viewL").addClass('hidden-div');
    $("#viewL-select").removeClass('hidden-div');
});


$("#spatial-tab-btn").on('click', function(evt) {
    //disable this button
    $("#spatial-tab-btn").addClass("disabled");

    // enable the other button
    $("#selection-tab-btn").removeClass("disabled");

    // flip view
    $("#viewL-select").addClass('hidden-div');
    $("#viewL").removeClass('hidden-div');
});

function getAvailableVoxelTypes() {
    var voxel_types = [];

    // find all possible types of voxels: timepoints, stated and locations
    app.patient_data.forEach(function(patient) {
        if (-1 == voxel_types.findIndex(function(elem) {
                return elem.value == patient.name;
            })) {
            voxel_types.push({ type: 'patient', value: patient.name });
        }

        patient.timepoints.forEach(function(timepoint) {
            if (-1 == voxel_types.findIndex(function(elem) {
                    return elem.value == timepoint.time;
                })) {
                voxel_types.push({ type: 'time', value: timepoint.time });
            }

            timepoint.states.forEach(function(state) {
                if (-1 == voxel_types.findIndex(function(elem) {
                        return elem.value == state.state;
                    })) {
                    voxel_types.push({ type: 'state', value: state.state });
                }

                state.voxels.forEach(function(voxel) {
                    if (-1 == voxel_types.findIndex(function(elem) {
                            return elem.value == voxel.location;
                        })) {
                        voxel_types.push({ type: 'location', value: voxel.location });
                    }
                });
            });
        });
    });

    voxel_types.sort(function(a, b) {
        // locations first
        if (a.type == 'location' && b.type != 'location') return -1;
        if (b.type == 'location' && a.type != 'location') return 1;

        // timepoints second
        if (a.type == 'time' && b.type != 'time') return -1;
        if (b.type == 'time' && a.type != 'time') return 1;

        if (a.type == 'patient' && b.type != 'patient') return -1;
        if (b.type == 'patient' && a.type != 'patient') return 1;

        // only states should remain -- order does not matter
        return 0;
    });
}

