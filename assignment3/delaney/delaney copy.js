
//dataStr.replace(/(\([^\)]+),([^\(]+\))/g, "$1;$2");

$.get('data.csv', function (d) {
	processData(d);
	//processData(d);
})

var processData = function (dataStr) {
	var dataArr = dataStr.split('\n');
	var data = {};
	var header = dataArr.shift().split(/\t/)
	header[116]+="&2"
	header[117]+="&2"

	for(var ind = 0; ind < dataArr.length; ind += 1 ){
		var lineArr = dataArr[ind].split('\t');
		if(data.hasOwnProperty(lineArr[0])) {
			console.error("repeat " + lineArr[0]);
		} else {
			data[lineArr[0]] = {};

			for(var h = 1; h < lineArr.length; h+= 1){
				data[lineArr[0]][header[h]] = lineArr[h];
			}

		}
	}

	groups = {ketamine: {}, dilaudid: {}, morphine: {}};
	for(pt in data) {
		console.log(data[pt]['10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))'])
		var count = 0;
		if (data[pt]['10. Was the patient given any of the following medication/s? (choice=Hydromorphine (Dilaudid) 1mg or 0.015mg/kg (Answer 10.b.))'] === 'Checked') {
			groups.dilaudid[pt] = data[pt];
			count+=1;
		}
		if(data[pt]['10. Was the patient given any of the following medication/s? (choice=Ketamine 0.15mg/kg  (Answer 10.a.))'] === 'Checked'){
			groups.ketamine[pt] = data[pt];
			count+= 1;
		}
		if(data[pt]['10. Was the patient given any of the following medication/s? (choice=Morphine 0.1mg/kg  (Answer10.c.))'] === 'Checked') {
			groups.morphine[pt] = data[pt];
			count+= 1;
		}
		if(count > 1) {
			console.error(pt + ' is in multiple groups')
		}
	}

	var timePoints = [
		"0 Minutes","5 Minutes","10 Minutes","15 Minutes","20 Minutes", "30 Minutes", "40 Minutes", "50 Minutes", "60 Minutes", "75 Minutes", "90 Minutes", "105 Minutes", "120 Minutes"
	];

	var avgs = {};
	for(group in groups) {
		avgs[group] = {points: {}, std: {}, avg: {}, total: {}, count: {}};
		res = avgs[group];
		for(var i = 1; i < timePoints.length; i += 1) {
			for(pt in groups[group]) {
	            tp1 = timePoints[i];
	            tp0 = timePoints[0];
	            tp = tp1;
				if (!res.total.hasOwnProperty(tp)) {
					res.total[tp] = 0;
					res.count[tp] = 0;
					res.points[tp] = [];
				}
				var num1 = groups[group][pt][tp1].match(/\d{1,2}/);
				var num0 = groups[group][pt][tp0].match(/\d{1,2}/);
				var num = num1 * 1 - num0 * 1;
				if (num) {
					num *= 1
					res.total[tp] += num; 
					res.count[tp] += 1;
					res.points[tp].push(num);
				}
			}
			res.avg[tp] = res.total[tp]/res.count[tp];
			res.std[tp] = 0;
			for(var j = 0; j < res.points[tp].length; j +=1) {
				res.std[tp] += Math.pow(res.avg[tp]-res.points[tp][j],2)/(res.count[tp]-1);
			}
			res.std[tp] = Math.sqrt(res.std[tp]);
		}
		
	}

	var demsCat = ["7. Does the patient have a history of chronic pain?", "2.  Age:", "3.  Gender:", "4.  Race:"];

	var dems = {};
	for(group in groups) {
		dems[group] = {points: {}, count: {}};
		var res = dems[group];
		for(var i = 0; i < demsCat.length; i += 1) {
			for(pt in groups[group]) {
	            tp = demsCat[i];
				if (!res.count.hasOwnProperty(tp)) {
					res.count[tp] = 0;
					res.points[tp] = [];
				}
				var num = groups[group][pt][tp];
				if (num) {
					res.count[tp] += 1;
					res.points[tp].push(num);
				}
			}
			if(i === 0) {
				
			}	
		}
	}
}


// JSON.stringify(avgs.ketamine.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
// JSON.stringify(avgs.dilaudid.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
// JSON.stringify(avgs.morphine.avg).replace(/,/g, "\n").replace(/:/g, "\t").replace(/ Minutes|\"|\{|\}/g, "")
//20 Minutes: "7"30 Minutes: "No"40 Minutes: "6"50 Minutes: "6"60 Minutes: "6"75 Minutes: "(5) Moderate Pain"90 Minutes: "(5) Moderate Pain"105 Minutes: "(5) Moderate Pain"120 Minutes: "4"